import os
import ssl
from functools import lru_cache

from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import DeclarativeBase, sessionmaker


class Base(DeclarativeBase):
    pass


def uses_tidb_settings() -> bool:
    return not os.environ.get('DATABASE_URL') and any(
        os.environ.get(key, '').strip() for key in ('TIDB_HOST', 'TIDB_USER', 'TIDB_PASSWORD')
    )


def get_database_url():
    url = os.environ.get('DATABASE_URL')
    if url:
        return url
    if uses_tidb_settings():
        settings = {key: os.environ.get(key, '') for key in (
            'TIDB_HOST', 'TIDB_USER', 'TIDB_PASSWORD', 'TIDB_DB_NAME',
        )}
        if not all(value.strip() for value in settings.values()):
            raise RuntimeError('Cấu hình TiDB thiếu host, user, password hoặc database.')
        try:
            port = int(os.environ.get('TIDB_PORT') or '4000')
            if not 1 <= port <= 65535:
                raise ValueError
        except ValueError:
            raise RuntimeError('TIDB_PORT phải là cổng hợp lệ.') from None
        return URL.create(
            'mysql+pymysql', username=settings['TIDB_USER'].strip(),
            password=settings['TIDB_PASSWORD'], host=settings['TIDB_HOST'].strip(),
            port=port, database=settings['TIDB_DB_NAME'].strip(), query={'charset': 'utf8mb4'},
        )
    user = os.environ.get('MYSQL_USER')
    password = os.environ.get('MYSQL_PASSWORD')
    database = os.environ.get('MYSQL_DATABASE')
    host = os.environ.get('MYSQL_HOST')
    if all((user, password, database, host)):
        return URL.create('mysql+pymysql', username=user, password=password, host=host, port=3306, database=database, query={'charset': 'utf8mb4'})
    raise RuntimeError('DATABASE_URL chưa được thiết lập')


def get_connect_args():
    if not uses_tidb_settings():
        return {}
    # Use the OS trust store by default. A supplied CA path must exist in the
    # running container/server, rather than referring to the developer's PC.
    context = ssl.create_default_context(cafile=os.environ.get('TIDB_CA_PATH') or None)
    return {'ssl': context, 'connect_timeout': 10, 'read_timeout': 30, 'write_timeout': 30}


@lru_cache
def get_engine():
    return create_engine(get_database_url(), pool_pre_ping=True, pool_recycle=300,
                         connect_args=get_connect_args())


def get_db():
    with sessionmaker(bind=get_engine(), expire_on_commit=False)() as session:
        yield session
