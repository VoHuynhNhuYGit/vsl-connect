import os
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db import get_database_url, get_engine
from app.main import app
from app.models import Course, Lesson, Sign, User
from app.security import hash_password


@pytest.fixture
def client(tmp_path):
    old_url = os.environ.get('DATABASE_URL')
    old_auth_secret = os.environ.get('AUTH_TOKEN_SECRET')
    os.environ['DATABASE_URL'] = f"sqlite:///{(tmp_path / 'test.db').as_posix()}"
    os.environ['AUTH_TOKEN_SECRET'] = 'test-authentication-secret-that-is-long-enough'
    get_engine.cache_clear()
    config = Config(str(Path(__file__).resolve().parents[1] / 'alembic.ini'))
    command.upgrade(config, 'head')
    engine = get_engine()

    @event.listens_for(engine, 'connect')
    def enable_foreign_keys(connection, _record):
        connection.execute('PRAGMA foreign_keys=ON')

    with Session(engine) as session:
        session.add_all([
            User(id=1, email='admin@example.com', display_name='Admin', password_hash=hash_password('correct-horse-battery-staple'), role='admin'),
            User(id=2, email='learner@example.com', display_name='Learner', password_hash=hash_password('correct-horse-battery-staple'), role='learner'),
            Course(id=1, slug='public', title='Công khai', difficulty='Cơ bản', is_published=True),
            Course(id=2, slug='draft', title='Bản nháp', difficulty='Cơ bản', is_published=False),
            Lesson(id=1, course_id=1, title='Đã xuất bản', position=1, is_published=True),
            Lesson(id=2, course_id=1, title='Bản nháp', position=2, is_published=False),
            Sign(id=1, label='Xin chào', topic='Chào hỏi', region='Bắc', is_published=True),
            Sign(id=2, label='Xin lỗi', topic='Chào hỏi', region='Nam', is_published=True),
            Sign(id=3, label='Chưa duyệt', topic='Khác', region='Bắc', is_published=False),
        ])
        session.commit()
    with TestClient(app) as test_client:
        yield test_client
    engine.dispose()
    get_engine.cache_clear()
    if old_url is None:
        os.environ.pop('DATABASE_URL', None)
    else:
        os.environ['DATABASE_URL'] = old_url
    if old_auth_secret is None:
        os.environ.pop('AUTH_TOKEN_SECRET', None)
    else:
        os.environ['AUTH_TOKEN_SECRET'] = old_auth_secret


def test_public_content_and_pagination(client):
    assert client.get('/health').json() == {'status': 'ok'}
    assert client.get('/health/ready').status_code == 200
    assert [item['slug'] for item in client.get('/api/v1/courses').json()] == ['public']
    assert client.get('/api/v1/courses/draft').status_code == 404
    assert client.get('/api/v1/courses/draft/lessons').status_code == 404
    assert [item['id'] for item in client.get('/api/v1/courses/public/lessons').json()] == [1]
    assert [item['id'] for item in client.get('/api/v1/signs', params={'region': 'Bắc'}).json()] == [1]
    assert [item['id'] for item in client.get('/api/v1/signs', params={'q': 'lỗi'}).json()] == [2]
    assert client.get('/api/v1/signs/3').status_code == 404
    assert len(client.get('/api/v1/signs', params={'limit': 1, 'offset': 1}).json()) == 1
    assert client.get('/api/v1/signs', params={'limit': 101}).status_code == 422
    assert client.get('/api/v1/signs', params={'offset': -1}).status_code == 422


def test_database_constraints(client):
    engine = get_engine()
    with Session(engine) as session:
        session.add(Lesson(course_id=1, title='Trùng thứ tự', position=1, is_published=False))
        with pytest.raises(IntegrityError):
            session.commit()
        session.rollback()
        session.add(Lesson(course_id=999, title='Không có khóa học', position=1, is_published=False))
        with pytest.raises(IntegrityError):
            session.commit()


def test_unconfigured_database(monkeypatch):
    monkeypatch.delenv('DATABASE_URL', raising=False)
    for name in ('MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DATABASE', 'MYSQL_HOST'):
        monkeypatch.delenv(name, raising=False)
    get_engine.cache_clear()
    with TestClient(app) as client:
        assert client.get('/health').status_code == 200
        assert client.get('/health/ready').status_code == 503
        assert client.get('/api/v1/courses').status_code == 503


def test_database_url_supports_special_characters(monkeypatch):
    monkeypatch.delenv('DATABASE_URL', raising=False)
    monkeypatch.setenv('MYSQL_USER', 'vsl')
    monkeypatch.setenv('MYSQL_PASSWORD', 'a@b:c/%')
    monkeypatch.setenv('MYSQL_DATABASE', 'vsl_connect')
    monkeypatch.setenv('MYSQL_HOST', 'db')
    url = get_database_url()
    assert url.password == 'a@b:c/%'
    assert url.host == 'db'


def test_admin_crud_requires_admin_session_and_csrf(client):
    assert client.get('/api/v1/admin/overview').status_code == 401

    login = client.post('/api/v1/auth/login', json={'email': 'admin@example.com', 'password': 'correct-horse-battery-staple'})
    assert login.status_code == 200
    csrf_headers = {'X-CSRF-Token': login.json()['csrf_token']}
    assert client.get('/api/v1/admin/overview').json() == {'courses': 2, 'lessons': 2, 'signs': 3, 'users': 2}

    course_payload = {'slug': 'admin-course', 'title': 'Admin course', 'description': '', 'difficulty': 'Basic', 'is_published': False}
    assert client.post('/api/v1/admin/courses', json=course_payload).status_code == 403
    course = client.post('/api/v1/admin/courses', json=course_payload, headers=csrf_headers)
    assert course.status_code == 201
    course_id = course.json()['id']

    lesson = client.post('/api/v1/admin/lessons', json={'course_id': course_id, 'title': 'First lesson', 'description': '', 'position': 1, 'video_url': None, 'captions_url': None, 'is_published': False}, headers=csrf_headers)
    assert lesson.status_code == 201
    sign = client.post('/api/v1/admin/signs', json={'label': 'Test sign', 'topic': 'Test', 'region': 'North', 'description': '', 'video_url': None, 'source': None, 'is_published': False}, headers=csrf_headers)
    assert sign.status_code == 201
    user = client.post('/api/v1/admin/users', json={'email': 'new@example.com', 'display_name': 'New user', 'password': 'another-correct-password', 'role': 'learner'}, headers=csrf_headers)
    assert user.status_code == 201
    updated_user = client.put(f"/api/v1/admin/users/{user.json()['id']}", json={'display_name': 'Updated user', 'password': None, 'role': 'learner'}, headers=csrf_headers)
    assert updated_user.json()['display_name'] == 'Updated user'

    assert client.delete(f"/api/v1/admin/courses/{course_id}", headers=csrf_headers).status_code == 409
    assert client.delete(f"/api/v1/admin/lessons/{lesson.json()['id']}", headers=csrf_headers).status_code == 204
    assert client.delete(f"/api/v1/admin/courses/{course_id}", headers=csrf_headers).status_code == 204
    assert client.delete(f"/api/v1/admin/signs/{sign.json()['id']}", headers=csrf_headers).status_code == 204
    assert client.delete(f"/api/v1/admin/users/{user.json()['id']}", headers=csrf_headers).status_code == 204
    assert client.post('/api/v1/auth/logout').status_code == 403
    assert client.post('/api/v1/auth/logout', headers=csrf_headers).status_code == 204
    assert client.get('/api/v1/admin/overview').status_code == 401


def test_learner_cannot_access_admin_api(client):
    login = client.post('/api/v1/auth/login', json={'email': 'learner@example.com', 'password': 'correct-horse-battery-staple'})
    assert login.status_code == 200
    assert client.get('/api/v1/admin/users').status_code == 403


def test_password_change_invalidates_existing_session(client):
    login = client.post('/api/v1/auth/login', json={'email': 'admin@example.com', 'password': 'correct-horse-battery-staple'})
    csrf_headers = {'X-CSRF-Token': login.json()['csrf_token']}
    result = client.put('/api/v1/admin/users/1', json={'display_name': 'Admin', 'password': 'a-new-strong-password', 'role': 'admin'}, headers=csrf_headers)
    assert result.status_code == 200
    assert client.get('/api/v1/admin/overview').status_code == 401
    assert client.post('/api/v1/auth/login', json={'email': 'admin@example.com', 'password': 'a-new-strong-password'}).status_code == 200


@pytest.fixture
def google_config(monkeypatch):
    monkeypatch.setenv('GOOGLE_CLIENT_ID', 'test-client-id')
    monkeypatch.setenv('GOOGLE_CLIENT_SECRET', 'test-client-secret')
    monkeypatch.setenv('GOOGLE_REDIRECT_URI', 'http://localhost:8080/api/v1/auth/google/callback')
    monkeypatch.setenv('GOOGLE_ADMIN_REDIRECT_URI', 'http://admin.localhost:8080/api/v1/auth/google/callback')


def start_google(client, path='/api/v1/auth/google/start', headers=None):
    response = client.post(path, headers=headers) if headers else client.get(path)
    assert response.status_code == 200
    params = parse_qs(urlparse(response.json()['url']).query)
    assert params['code_challenge_method'] == ['S256']
    return params['state'][0]


def test_google_new_user_and_state_validation(client, google_config, monkeypatch):
    monkeypatch.setattr('app.google_auth.verify_google_code', lambda code, verifier, nonce, admin_origin: {'sub': 'google-new', 'email': 'new-google@example.com', 'name': 'Google User'})
    state = start_google(client)
    invalid = client.get('/api/v1/auth/google/callback', params={'state': 'invalid', 'code': 'test-code'}, follow_redirects=False)
    assert invalid.status_code == 303 and 'google_error=invalid' in invalid.headers['location']
    assert client.get('/api/v1/auth/me').status_code == 401
    state = start_google(client)
    response = client.get('/api/v1/auth/google/callback', params={'state': state, 'code': 'test-code'}, follow_redirects=False)
    assert response.status_code == 303 and response.headers['location'] == '/dang-nhap?google_success=1'
    assert client.get('/api/v1/auth/me').json()['user']['role'] == 'learner'
    assert client.get('/api/v1/admin/overview').status_code == 403
    assert start_google(client)


def test_google_existing_email_requires_explicit_link(client, google_config, monkeypatch):
    monkeypatch.setattr('app.google_auth.verify_google_code', lambda code, verifier, nonce, admin_origin: {'sub': 'google-admin', 'email': 'admin@example.com', 'name': 'Admin'})
    state = start_google(client, '/api/v1/auth/google/start?return_to=admin')
    response = client.get('/api/v1/auth/google/callback', params={'state': state, 'code': 'test-code'}, follow_redirects=False)
    assert 'google_error=conflict' in response.headers['location']
    assert client.get('/api/v1/auth/me').status_code == 401
    login = client.post('/api/v1/auth/login', json={'email': 'admin@example.com', 'password': 'correct-horse-battery-staple'})
    csrf = {'X-CSRF-Token': login.json()['csrf_token']}
    assert client.post('/api/v1/auth/google/link').status_code == 403
    state = start_google(client, '/api/v1/auth/google/link', csrf)
    response = client.get('/api/v1/auth/google/callback', params={'state': state, 'code': 'test-code'}, follow_redirects=False)
    assert 'google_success=1' in response.headers['location']
    assert client.post('/api/v1/auth/logout', headers={'X-CSRF-Token': client.get('/api/v1/auth/me').json()['csrf_token']}).status_code == 204
    state = start_google(client, '/api/v1/auth/google/start?return_to=admin')
    client.get('/api/v1/auth/google/callback', params={'state': state, 'code': 'test-code'}, follow_redirects=False)
    assert client.get('/api/v1/admin/overview').status_code == 200


def test_google_link_rejects_different_email_and_missing_session(client, google_config, monkeypatch):
    monkeypatch.setattr('app.google_auth.verify_google_code', lambda code, verifier, nonce, admin_origin: {'sub': 'other-google', 'email': 'other@example.com', 'name': 'Other'})
    login = client.post('/api/v1/auth/login', json={'email': 'admin@example.com', 'password': 'correct-horse-battery-staple'})
    csrf = {'X-CSRF-Token': login.json()['csrf_token']}
    state = start_google(client, '/api/v1/auth/google/link', csrf)
    response = client.get('/api/v1/auth/google/callback', params={'state': state, 'code': 'test-code'}, follow_redirects=False)
    assert 'google_error=conflict' in response.headers['location']
    state = start_google(client, '/api/v1/auth/google/link', csrf)
    assert client.post('/api/v1/auth/logout', headers=csrf).status_code == 204
    response = client.get('/api/v1/auth/google/callback', params={'state': state, 'code': 'test-code'}, follow_redirects=False)
    assert 'google_error=failed' in response.headers['location']
    with Session(get_engine()) as session:
        assert session.get(User, 1).google_sub is None


def test_google_admin_host_uses_its_own_callback_and_session(client, google_config, monkeypatch):
    with Session(get_engine()) as session:
        session.get(User, 1).google_sub = 'google-admin'
        session.commit()

    calls = []
    def verify(code, verifier, nonce, admin_origin):
        calls.append(admin_origin)
        return {'sub': 'google-admin', 'email': 'admin@example.com', 'name': 'Admin'}
    monkeypatch.setattr('app.google_auth.verify_google_code', verify)

    with TestClient(app, base_url='http://admin.localhost:8080') as admin_client:
        assert admin_client.get('/api/v1/auth/google/status').json()['configured'] is True
        response = admin_client.get('/api/v1/auth/google/start?return_to=admin')
        params = parse_qs(urlparse(response.json()['url']).query)
        assert params['redirect_uri'] == ['http://admin.localhost:8080/api/v1/auth/google/callback']
        callback = admin_client.get('/api/v1/auth/google/callback', params={'state': params['state'][0], 'code': 'test-code'}, follow_redirects=False)
        assert callback.headers['location'] == '/?google_success=1'
        assert calls == [True]
        assert admin_client.get('/api/v1/admin/overview').status_code == 200
        assert client.get('/api/v1/auth/me').status_code == 401


def test_media_upload_requires_admin_csrf_and_configuration(client, monkeypatch):
    image = b'\x89PNG\r\n\x1a\nexample'
    headers = {'Content-Type': 'image/png'}
    assert client.post('/api/v1/admin/media/upload', content=image, headers=headers).status_code == 401
    login = client.post('/api/v1/auth/login', json={'email': 'learner@example.com', 'password': 'correct-horse-battery-staple'})
    assert client.post('/api/v1/admin/media/upload', content=image, headers={**headers, 'X-CSRF-Token': login.json()['csrf_token']}).status_code == 403
    client.post('/api/v1/auth/logout', headers={'X-CSRF-Token': login.json()['csrf_token']})
    login = client.post('/api/v1/auth/login', json={'email': 'admin@example.com', 'password': 'correct-horse-battery-staple'})
    assert client.post('/api/v1/admin/media/upload', content=image, headers=headers).status_code == 403
    monkeypatch.delenv('CLOUDINARY_CLOUD_NAME', raising=False)
    headers['X-CSRF-Token'] = login.json()['csrf_token']
    assert client.post('/api/v1/admin/media/upload', content=image, headers=headers).status_code == 503


def test_media_upload_validates_files_and_forwards_to_cloudinary(client, monkeypatch):
    import hashlib
    import app.media as media
    monkeypatch.setenv('CLOUDINARY_CLOUD_NAME', 'test-cloud')
    monkeypatch.setenv('CLOUDINARY_API_KEY', 'test-key')
    monkeypatch.setenv('CLOUDINARY_API_SECRET', 'test-secret')
    login = client.post('/api/v1/auth/login', json={'email': 'admin@example.com', 'password': 'correct-horse-battery-staple'})
    headers = {'Content-Type': 'image/png', 'X-CSRF-Token': login.json()['csrf_token']}
    assert client.post('/api/v1/admin/media/upload', content=b'<script>', headers=headers).status_code == 415
    assert client.post('/api/v1/admin/media/upload', content=b'', headers=headers).status_code == 400
    assert client.post('/api/v1/admin/media/upload', content=b'hello', headers={**headers, 'Content-Type': 'text/html'}).status_code == 415
    monkeypatch.setitem(media.FORMATS, 'image/png', ('image', 'png', 20))
    assert client.post('/api/v1/admin/media/upload', content=b'\x89PNG\r\n\x1a\n' + b'a' * 13, headers=headers).status_code == 413

    class CloudinaryResponse:
        def raise_for_status(self):
            pass
        def json(self):
            return {'secure_url': 'https://res.cloudinary.com/test-cloud/image/upload/sample.png', 'public_id': 'vsl-connect/sample', 'resource_type': 'image'}

    def cloudinary_post(url, data, files, timeout):
        assert url == 'https://api.cloudinary.com/v1_1/test-cloud/image/upload'
        assert data['signature'] == hashlib.sha1(f"folder=vsl-connect&timestamp={data['timestamp']}test-secret".encode()).hexdigest()
        assert files['file'][1].read() == b'\x89PNG\r\n\x1a\nexample'
        return CloudinaryResponse()

    monkeypatch.setattr(media.requests, 'post', cloudinary_post)
    result = client.post('/api/v1/admin/media/upload', content=b'\x89PNG\r\n\x1a\nexample', headers=headers)
    assert result.status_code == 201
    assert result.json()['public_id'] == 'vsl-connect/sample'
    assert 'test-secret' not in result.text


def test_media_upload_video_and_cloudinary_failure(client, monkeypatch):
    import app.media as media
    monkeypatch.setenv('CLOUDINARY_CLOUD_NAME', 'test-cloud')
    monkeypatch.setenv('CLOUDINARY_API_KEY', 'test-key')
    monkeypatch.setenv('CLOUDINARY_API_SECRET', 'test-secret')
    login = client.post('/api/v1/auth/login', json={'email': 'admin@example.com', 'password': 'correct-horse-battery-staple'})
    headers = {'Content-Type': 'video/mp4', 'X-CSRF-Token': login.json()['csrf_token']}
    video = b'\x00\x00\x00\x18ftypmp42video'

    class CloudinaryResponse:
        def raise_for_status(self):
            pass
        def json(self):
            return {'secure_url': 'https://res.cloudinary.com/test-cloud/video/upload/sample.mp4', 'public_id': 'vsl-connect/sample', 'resource_type': 'video'}

    def cloudinary_post(url, data, files, timeout):
        assert url.endswith('/video/upload')
        assert files['file'][1].read() == video
        return CloudinaryResponse()

    monkeypatch.setattr(media.requests, 'post', cloudinary_post)
    assert client.post('/api/v1/admin/media/upload', content=video, headers=headers).json()['resource_type'] == 'video'
    def fail(*args, **kwargs):
        raise media.requests.Timeout('sensitive upstream details')
    monkeypatch.setattr(media.requests, 'post', fail)
    response = client.post('/api/v1/admin/media/upload', content=video, headers=headers)
    assert response.status_code == 502
    assert 'sensitive upstream details' not in response.text


def test_google_id_token_nonce_and_email_verification(monkeypatch):
    from app.google_auth import verify_google_code
    class TokenResponse:
        def raise_for_status(self):
            pass
        def json(self):
            return {'id_token': 'test-token'}
    monkeypatch.setenv('GOOGLE_CLIENT_ID', 'test-client-id')
    monkeypatch.setenv('GOOGLE_CLIENT_SECRET', 'test-secret')
    monkeypatch.setenv('GOOGLE_REDIRECT_URI', 'http://localhost:8080/api/v1/auth/google/callback')
    monkeypatch.setattr('app.google_auth.requests.post', lambda *args, **kwargs: TokenResponse())
    monkeypatch.setattr('app.google_auth.id_token.verify_oauth2_token', lambda *args: {'nonce': 'expected', 'email_verified': False, 'sub': 'id', 'email': 'email@example.com'})
    with pytest.raises(ValueError):
        verify_google_code('code', 'verifier', 'expected')
    monkeypatch.setattr('app.google_auth.id_token.verify_oauth2_token', lambda *args: {'nonce': 'wrong', 'email_verified': True, 'sub': 'id', 'email': 'email@example.com'})
    with pytest.raises(ValueError):
        verify_google_code('code', 'verifier', 'expected')
