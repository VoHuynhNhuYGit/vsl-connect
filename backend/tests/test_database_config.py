import ssl

import pytest

from app.db import get_connect_args, get_database_url


@pytest.fixture(autouse=True)
def clean_database_settings(monkeypatch):
    for key in ('DATABASE_URL', 'TIDB_HOST', 'TIDB_PORT', 'TIDB_USER', 'TIDB_PASSWORD',
                'TIDB_DB_NAME', 'TIDB_CA_PATH', 'MYSQL_HOST', 'MYSQL_USER',
                'MYSQL_PASSWORD', 'MYSQL_DATABASE'):
        monkeypatch.delenv(key, raising=False)


def set_tidb(monkeypatch):
    for key, value in {'TIDB_HOST': 'example.tidbcloud.com', 'TIDB_USER': 'qa.root',
                       'TIDB_PASSWORD': 'p@ss:/?#%', 'TIDB_DB_NAME': 'qa_database'}.items():
        monkeypatch.setenv(key, value)


def test_tidb_preserves_special_password_and_requires_verified_tls(monkeypatch):
    set_tidb(monkeypatch)
    url = get_database_url()
    assert url.drivername == 'mysql+pymysql'
    assert url.password == 'p@ss:/?#%'
    assert url.port == 4000
    args = get_connect_args()
    assert args['ssl'].check_hostname is True
    assert args['ssl'].verify_mode == ssl.CERT_REQUIRED
    assert args['connect_timeout'] == 10


def test_explicit_url_has_priority_over_tidb(monkeypatch):
    set_tidb(monkeypatch)
    monkeypatch.setenv('DATABASE_URL', 'sqlite:///:memory:')
    assert get_database_url() == 'sqlite:///:memory:'
    assert get_connect_args() == {}


def test_incomplete_tidb_does_not_silently_use_local_mysql(monkeypatch):
    monkeypatch.setenv('TIDB_PASSWORD', 'do-not-print-this')
    monkeypatch.setenv('MYSQL_HOST', 'db')
    with pytest.raises(RuntimeError, match='Cấu hình TiDB thiếu') as failure:
        get_database_url()
    assert 'do-not-print-this' not in str(failure.value)


@pytest.mark.parametrize('port', ['bad', '0', '65536'])
def test_invalid_tidb_port(monkeypatch, port):
    set_tidb(monkeypatch)
    monkeypatch.setenv('TIDB_PORT', port)
    with pytest.raises(RuntimeError, match='TIDB_PORT'):
        get_database_url()


def test_local_mysql_still_works_with_empty_tidb(monkeypatch):
    for key, value in {'MYSQL_HOST': 'db', 'MYSQL_USER': 'local',
                       'MYSQL_PASSWORD': 'local-password', 'MYSQL_DATABASE': 'local_db'}.items():
        monkeypatch.setenv(key, value)
    assert get_database_url().host == 'db'
    assert get_database_url().port == 3306
    assert get_connect_args() == {}


def test_custom_ca_is_not_silently_ignored(monkeypatch, tmp_path):
    set_tidb(monkeypatch)
    monkeypatch.setenv('TIDB_CA_PATH', str(tmp_path / 'missing-ca.pem'))
    with pytest.raises(FileNotFoundError):
        get_connect_args()
