from datetime import timedelta
import json

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from test_backend import client, google_config, start_google, confirm_google
from app.db import get_engine
from app.main import app
from app.models import AccountVerification, User
from app.security import hash_password
from app import verification as codes


def login(client):
    response = client.post('/api/v1/auth/login', json={'email': 'learner@example.com', 'password': 'correct-horse-battery-staple'})
    assert response.status_code == 200
    return {'X-CSRF-Token': response.json()['csrf_token']}


def oauth(client, monkeypatch, sub='new-sub', email='new@example.com', link_headers=None):
    monkeypatch.setattr('app.google_auth.verify_google_code', lambda *args: {'sub': sub, 'email': email, 'name': 'Người dùng Google'})
    state = start_google(client, '/api/v1/auth/google/link' if link_headers else '/api/v1/auth/google/start', link_headers)
    result = client.get('/api/v1/auth/google/callback', params={'state': state, 'code': 'test'}, follow_redirects=False)
    return result


def test_edit_profile_validation_and_access(client):
    body = {'display_name': 'Tên mới', 'gender': 'female', 'phone_number': '+84 (912) 345-678'}
    assert client.put('/api/v1/profile', json=body).status_code == 401
    headers = login(client)
    assert client.put('/api/v1/profile', json=body).status_code == 403
    for bad in ({**body, 'role': 'admin'}, {**body, 'email': 'other@example.com'}, {**body, 'gender': 'invalid'}, {**body, 'phone_number': 'abc123'}, {**body, 'display_name': '  '}):
        assert client.put('/api/v1/profile', json=bad, headers=headers).status_code == 422
    response = client.put('/api/v1/profile', json=body, headers=headers)
    assert response.status_code == 200
    assert response.json()['phone_number'] == '+84912345678'
    user = client.get('/api/v1/auth/me').json()['user']
    assert user['gender'] == 'female' and user['display_name'] == 'Tên mới' and user['role'] == 'learner'
    assert client.put('/api/v1/profile', json={'display_name': 'Tên mới', 'gender': None, 'phone_number': ''}, headers=headers).json()['phone_number'] is None


def test_password_change_revokes_old_sessions(client):
    headers = login(client)
    old_cookie = client.cookies.get('vsl_session')
    body = {'current_password': 'incorrect', 'new_password': 'new-password-long-enough'}
    assert client.post('/api/v1/profile/password', json=body).status_code == 403
    assert client.post('/api/v1/profile/password', json=body, headers=headers).status_code == 400
    assert client.post('/api/v1/profile/password', json={**body, 'new_password': 'short'}, headers=headers).status_code == 422
    result = client.post('/api/v1/profile/password', json={**body, 'current_password': 'correct-horse-battery-staple'}, headers=headers)
    assert result.status_code == 200
    assert client.get('/api/v1/auth/me').status_code == 200
    with TestClient(app) as other:
        other.cookies.set('vsl_session', old_cookie)
        assert other.get('/api/v1/auth/me').status_code == 401
    assert client.post('/api/v1/auth/login', json={'email': 'learner@example.com', 'password': 'correct-horse-battery-staple'}).status_code == 401
    assert client.post('/api/v1/auth/login', json={'email': 'learner@example.com', 'password': body['new_password']}).status_code == 200


def test_google_change_needs_both_codes_and_no_early_mutation(client, google_config, monkeypatch):
    headers = login(client)
    with Session(get_engine()) as db:
        user = db.get(User, 2); user.google_sub = 'previous-sub'; user.google_email = 'previous@example.com'; db.commit()
    assert 'google_pending=1' in oauth(client, monkeypatch, link_headers=headers).headers['location']
    assert [message[0] for message in google_config] == ['learner@example.com', 'new@example.com']
    pending = client.get('/api/v1/auth/google/pending').json()
    assert pending['google_email'] and 'new@example.com' not in json.dumps(pending)
    first, second = google_config[0][1], google_config[1][1]
    assert client.post('/api/v1/auth/google/verify', json={'code': first, 'google_code': second}).status_code == 403
    verify_headers = {'X-CSRF-Token': pending['csrf_token']}
    assert client.post('/api/v1/auth/google/verify', json={'code': first}, headers=verify_headers).status_code == 400
    with Session(get_engine()) as db:
        assert db.get(User, 2).google_sub == 'previous-sub'
        row = db.scalar(select(AccountVerification))
        assert first not in row.payload and second not in row.payload
    result = client.post('/api/v1/auth/google/verify', json={'code': first, 'google_code': second}, headers=verify_headers)
    assert result.status_code == 200 and result.json()['user']['google_email'] == 'new@example.com'
    assert client.post('/api/v1/auth/google/verify', json={'code': first, 'google_code': second}, headers=verify_headers).status_code == 400


def test_verification_wrong_attempts_and_expiry(client, google_config, monkeypatch):
    assert 'google_pending=1' in oauth(client, monkeypatch).headers['location']
    pending = client.get('/api/v1/auth/google/pending').json(); headers = {'X-CSRF-Token': pending['csrf_token']}
    wrong = '000000' if google_config[-1][1] != '000000' else '111111'
    for _ in range(5):
        assert client.post('/api/v1/auth/google/verify', json={'code': wrong}, headers=headers).status_code == 400
    assert client.post('/api/v1/auth/google/verify', json={'code': google_config[-1][1]}, headers=headers).status_code == 400
    assert client.get('/api/v1/auth/me').status_code == 401
    assert 'google_pending=1' in oauth(client, monkeypatch).headers['location']
    with Session(get_engine()) as db:
        row = db.scalar(select(AccountVerification).order_by(AccountVerification.created_at.desc())); row.expires_at = codes.now() - timedelta(seconds=1); db.commit()
    assert client.get('/api/v1/auth/google/pending').status_code == 400
    with Session(get_engine()) as db:
        assert db.scalar(select(User).where(User.email == 'new@example.com')) is None


def test_verification_resend_limits_cancel_and_account_binding(client, google_config, monkeypatch):
    headers = login(client); oauth(client, monkeypatch, link_headers=headers)
    pending = client.get('/api/v1/auth/google/pending').json(); csrf = {'X-CSRF-Token': pending['csrf_token']}
    assert client.post('/api/v1/auth/google/resend', headers=csrf).status_code == 429
    old_codes = google_config[:]
    with Session(get_engine()) as db:
        row = db.scalar(select(AccountVerification)); row.sent_at = codes.now() - timedelta(seconds=61); db.commit()
    assert client.post('/api/v1/auth/google/resend', headers=csrf).status_code == 200
    assert client.post('/api/v1/auth/google/verify', json={'code': old_codes[0][1], 'google_code': old_codes[1][1]}, headers=csrf).status_code == 400
    token = client.cookies.get(codes.COOKIE)
    with TestClient(app) as stranger:
        stranger.cookies.set(codes.COOKIE, token)
        assert stranger.post('/api/v1/auth/google/verify', json={'code': google_config[-2][1], 'google_code': google_config[-1][1]}, headers=csrf).status_code == 401
    assert client.post('/api/v1/auth/google/cancel', headers=csrf).status_code == 200
    assert client.get('/api/v1/auth/google/pending').status_code == 400


def test_google_only_account_password_setup_and_unlink(client, google_config, monkeypatch):
    oauth(client, monkeypatch)
    result = confirm_google(client, google_config)
    assert result.status_code == 200 and result.json()['user']['password_enabled'] is False
    headers = {'X-CSRF-Token': result.json()['csrf_token']}
    assert client.post('/api/v1/auth/google/unlink', headers=headers).status_code == 400
    result = client.post('/api/v1/profile/password/code', headers=headers)
    assert result.status_code == 200
    body = {'code': google_config[-1][1], 'new_password': 'google-account-new-password'}
    result = client.post('/api/v1/profile/password', json=body, headers=headers)
    assert result.status_code == 200 and result.json()['user']['password_enabled'] is True
    headers = {'X-CSRF-Token': result.json()['csrf_token']}
    assert client.post('/api/v1/auth/google/unlink', headers=headers, json={'current_password': body['new_password']}).status_code == 200
    assert confirm_google(client, google_config).json()['user']['is_google_linked'] is False
    assert client.post('/api/v1/auth/login', json={'email': 'new@example.com', 'password': body['new_password']}).status_code == 200


def test_link_collision_and_credentials_changed(client, google_config, monkeypatch):
    headers = login(client)
    with Session(get_engine()) as db:
        db.get(User, 1).google_sub = 'owned-sub'; db.commit()
    assert 'google_error=conflict' in oauth(client, monkeypatch, sub='owned-sub', link_headers=headers).headers['location']
    oauth(client, monkeypatch, link_headers=headers)
    pending = client.get('/api/v1/auth/google/pending').json()
    with Session(get_engine()) as db:
        db.get(User, 2).password_hash = hash_password('changed-while-verifying'); db.commit()
    assert client.post('/api/v1/auth/google/verify', json={'code': google_config[-2][1], 'google_code': google_config[-1][1]}, headers={'X-CSRF-Token': pending['csrf_token']}).status_code in (401, 409)
    with Session(get_engine()) as db:
        assert db.get(User, 2).google_sub is None


def test_missing_email_configuration_fails_closed(client, monkeypatch):
    monkeypatch.setenv('SMTP_HOST', '')
    headers = login(client)
    assert client.post('/api/v1/profile/password/code', headers=headers).status_code == 503
    assert client.get('/api/v1/auth/google/start').status_code == 503
    assert client.get('/api/v1/auth/google/status').json()['configured'] is False


def test_unsupported_admin_localhost_callback_is_rejected(client, google_config, monkeypatch):
    monkeypatch.setenv('GOOGLE_ADMIN_REDIRECT_URI', 'http://admin.localhost:8080/api/v1/auth/google/callback')
    with TestClient(app, base_url='http://admin.localhost:8080') as admin:
        assert admin.get('/api/v1/auth/google/status').json()['configured'] is False
        result = admin.get('/api/v1/auth/google/start?return_to=admin')
        assert result.status_code == 503
        assert '127.0.0.1' in result.json()['detail']


def test_email_limits_and_delivery_failure_keep_links_unchanged(client, google_config, monkeypatch):
    headers = login(client)
    for _ in range(5):
        assert client.post('/api/v1/profile/password/code', headers=headers).status_code == 200
    assert client.post('/api/v1/profile/password/code', headers=headers).status_code == 429
    assert len(google_config) == 5
    with Session(get_engine()) as db:
        assert db.get(User, 2).google_sub is None


def test_google_rate_limit_reports_wait_and_recovers_after_window(client, google_config, monkeypatch):
    from urllib.parse import parse_qs, urlparse
    headers = login(client)
    for _ in range(5):
        assert 'google_pending=1' in oauth(client, monkeypatch, email='learner@example.com', link_headers=headers).headers['location']
    response = oauth(client, monkeypatch, email='learner@example.com', link_headers=headers)
    query = parse_qs(urlparse(response.headers['location']).query)
    assert query['google_error'] == ['rate_limited']
    assert 1 <= int(query['retry_after'][0]) <= 3600
    assert len(google_config) == 5
    limited = client.post('/api/v1/profile/password/code', headers=headers)
    assert limited.status_code == 429 and 1 <= int(limited.headers['Retry-After']) <= 3600
    with Session(get_engine()) as db:
        assert db.get(User, 2).google_sub is None
        row = db.scalar(select(AccountVerification).order_by(AccountVerification.created_at))
        row.created_at = codes.now() - timedelta(minutes=61)
        db.commit()
    assert 'google_pending=1' in oauth(client, monkeypatch, email='learner@example.com', link_headers=headers).headers['location']
    assert len(google_config) == 6


def test_google_callback_reports_mail_failure_without_secret(client, google_config, monkeypatch):
    from fastapi import HTTPException
    def unavailable(*args):
        raise HTTPException(status_code=503, detail='private provider credentials')
    logged = []
    monkeypatch.setattr('app.google_auth.logger.warning', lambda message, *args: logged.append(message % args))
    monkeypatch.setattr('app.verification.send_verification_email', unavailable)
    assert 'google_error=email_unavailable' in oauth(client, monkeypatch).headers['location']
    assert all('private provider credentials' not in message for message in logged)
    assert any('category=email_unavailable' in message for message in logged)
    assert client.get('/api/v1/auth/me').status_code == 401


def test_admin_password_reset_enables_local_login(client):
    with Session(get_engine()) as db:
        db.get(User, 2).password_enabled = False
        db.commit()
    admin = client.post('/api/v1/auth/login', json={'email': 'admin@example.com', 'password': 'correct-horse-battery-staple'}).json()
    result = client.put('/api/v1/admin/users/2', json={'display_name': 'Learner', 'role': 'learner', 'password': 'admin-reset-password-2026'}, headers={'X-CSRF-Token': admin['csrf_token']})
    assert result.status_code == 200 and result.json()['password_enabled'] is True
    assert client.post('/api/v1/auth/login', json={'email': 'learner@example.com', 'password': 'admin-reset-password-2026'}).status_code == 200


def test_smtp_uses_tls_and_does_not_expose_delivery_errors(monkeypatch):
    from app.mail import send_verification_email
    from fastapi import HTTPException
    import pytest
    calls = []
    class SMTP:
        def __init__(self, *args, **kwargs): calls.append('connect')
        def __enter__(self): return self
        def __exit__(self, *args): pass
        def ehlo(self): calls.append('ehlo')
        def starttls(self, **kwargs): calls.append('tls')
        def login(self, *args): calls.append('login')
        def send_message(self, message):
            calls.append('send')
            assert message['To'] == 'target@example.com'
            assert '123456' in message.get_content()
    for key, value in {'SMTP_HOST': 'smtp.example.test', 'SMTP_FROM': 'sender@example.test', 'SMTP_USERNAME': 'sender', 'SMTP_PASSWORD': 'private', 'SMTP_SECURITY': 'starttls', 'SMTP_PORT': '587'}.items():
        monkeypatch.setenv(key, value)
    monkeypatch.setattr('app.mail.smtplib.SMTP', SMTP)
    send_verification_email('target@example.com', '123456')
    assert calls == ['connect', 'ehlo', 'tls', 'ehlo', 'login', 'send']
    def fail(*args, **kwargs): raise OSError('private provider details')
    monkeypatch.setattr('app.mail.smtplib.SMTP', fail)
    with pytest.raises(HTTPException) as error:
        send_verification_email('target@example.com', '123456')
    assert error.value.status_code == 503 and 'private' not in error.value.detail
