"""Google authorization-code login and explicit account linking."""

import base64
import hashlib
import hmac
import os
import secrets
import time
from urllib.parse import urlencode, urlparse

import requests
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse, RedirectResponse
from google.auth.exceptions import GoogleAuthError
from google.auth.transport.requests import Request as GoogleRequest
from google.oauth2 import id_token
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.auth import CurrentUser, SESSION_COOKIE, get_current_user
from app.dependencies import Db
from app.models import User
from app.security import create_session, hash_password, read_oauth_state, sign_oauth_state

router = APIRouter(prefix='/api/v1/auth/google', tags=['authentication'])
STATE_COOKIE = 'vsl_google_oauth'
DEFAULT_ADMIN_REDIRECT_URI = 'http://admin.localhost:8080/api/v1/auth/google/callback'


def is_admin_host(request: Request) -> bool:
    admin_uri = os.getenv('GOOGLE_ADMIN_REDIRECT_URI', DEFAULT_ADMIN_REDIRECT_URI).strip()
    return bool(urlparse(admin_uri).hostname and request.url.hostname == urlparse(admin_uri).hostname)


def configuration(admin_origin: bool = False):
    client_id = os.getenv('GOOGLE_CLIENT_ID', '').strip()
    client_secret = os.getenv('GOOGLE_CLIENT_SECRET', '').strip()
    redirect_uri = os.getenv('GOOGLE_ADMIN_REDIRECT_URI', DEFAULT_ADMIN_REDIRECT_URI).strip() if admin_origin else os.getenv('GOOGLE_REDIRECT_URI', '').strip()
    uri = urlparse(redirect_uri)
    if not client_id or not client_secret or not uri.netloc or uri.path != '/api/v1/auth/google/callback' or uri.query or uri.fragment:
        raise HTTPException(status_code=503, detail='Đăng nhập Google chưa được cấu hình.')
    if uri.scheme != 'https' and not (uri.scheme == 'http' and uri.hostname in ('localhost', '127.0.0.1', 'admin.localhost')):
        raise HTTPException(status_code=503, detail='Địa chỉ callback Google phải dùng HTTPS.')
    return client_id, client_secret, redirect_uri


def secure_cookie() -> bool:
    return os.getenv('AUTH_COOKIE_SECURE', 'false').lower() == 'true'


@router.get('/status')
def status(request: Request):
    try:
        configuration(is_admin_host(request))
        return {'configured': True}
    except HTTPException:
        return {'configured': False}


def start_flow(purpose: str, user_id: int | None = None, admin_origin: bool = False):
    client_id, _, redirect_uri = configuration(admin_origin)
    state = secrets.token_urlsafe(32)
    nonce = secrets.token_urlsafe(32)
    verifier = secrets.token_urlsafe(64)
    challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode('ascii')).digest()).rstrip(b'=').decode('ascii')
    payload = {'state': state, 'nonce': nonce, 'verifier': verifier, 'purpose': purpose, 'user_id': user_id, 'admin_origin': admin_origin, 'exp': int(time.time()) + 600}
    params = {'client_id': client_id, 'redirect_uri': redirect_uri, 'response_type': 'code', 'scope': 'openid email profile', 'state': state, 'nonce': nonce, 'code_challenge': challenge, 'code_challenge_method': 'S256'}
    response = JSONResponse({'url': 'https://accounts.google.com/o/oauth2/v2/auth?' + urlencode(params)})
    response.set_cookie(STATE_COOKIE, sign_oauth_state(payload), max_age=600, httponly=True, secure=secure_cookie(), samesite='lax', path='/api/v1/auth/google')
    response.headers['Cache-Control'] = 'no-store'
    return response


@router.get('/start')
def start(request: Request, return_to: str = 'login'):
    if return_to not in ('login', 'admin'):
        raise HTTPException(status_code=400, detail='Trang đích không hợp lệ.')
    return start_flow(return_to, admin_origin=is_admin_host(request))


@router.post('/link')
def link(request: Request, user: CurrentUser):
    if not hmac.compare_digest(request.headers.get('X-CSRF-Token', ''), request.state.session_claims['csrf']):
        raise HTTPException(status_code=403, detail='Yêu cầu xác thực CSRF không hợp lệ.')
    return start_flow('link', user.id, is_admin_host(request))


def verify_google_code(code: str, verifier: str, nonce: str, admin_origin: bool = False):
    client_id, client_secret, redirect_uri = configuration(admin_origin)
    token_response = requests.post('https://oauth2.googleapis.com/token', data={'code': code, 'client_id': client_id, 'client_secret': client_secret, 'redirect_uri': redirect_uri, 'grant_type': 'authorization_code', 'code_verifier': verifier}, timeout=10)
    token_response.raise_for_status()
    token = token_response.json()['id_token']
    google_request = GoogleRequest()
    def bounded_request(*args, **kwargs):
        kwargs['timeout'] = 10
        return google_request(*args, **kwargs)
    claims = id_token.verify_oauth2_token(token, bounded_request, client_id)
    if not isinstance(claims.get('nonce'), str) or not hmac.compare_digest(claims['nonce'], nonce):
        raise ValueError('Invalid nonce')
    if claims.get('email_verified') is not True or not isinstance(claims.get('sub'), str) or not isinstance(claims.get('email'), str):
        raise ValueError('Missing verified identity')
    if not 0 < len(claims['sub']) <= 255 or not 0 < len(claims['email']) <= 320:
        raise ValueError('Invalid identity')
    return claims


@router.get('/callback')
def callback(request: Request, db: Db, state: str = '', code: str = '', error: str = ''):
    payload = read_oauth_state(request.cookies.get(STATE_COOKIE))
    purpose = payload.get('purpose') if payload else None
    admin_origin = is_admin_host(request)
    destination = '/' if admin_origin else ('/admin' if purpose == 'admin' else '/dang-nhap')

    def finish(error_code: str | None = None):
        result = RedirectResponse(destination + (f'?google_error={error_code}' if error_code else '?google_success=1'), status_code=303)
        result.delete_cookie(STATE_COOKIE, path='/api/v1/auth/google')
        result.headers['Cache-Control'] = 'no-store'
        result.headers['Referrer-Policy'] = 'no-referrer'
        return result

    if not payload or not state or not hmac.compare_digest(str(payload.get('state', '')), state) or not code or error:
        return finish('invalid')
    if purpose not in ('admin', 'login', 'link') or bool(payload.get('admin_origin', False)) != admin_origin:
        return finish('invalid')
    try:
        claims = verify_google_code(code, payload['verifier'], payload['nonce'], admin_origin)
        email = claims['email'].strip().lower()
        existing_google = db.scalar(select(User).where(User.google_sub == claims['sub']))
        if purpose == 'link':
            user = get_current_user(request, db)
            if user.id != payload['user_id'] or user.email.lower() != email or (existing_google and existing_google.id != user.id) or (user.google_sub and user.google_sub != claims['sub']):
                return finish('conflict')
            user.google_sub = claims['sub']
        elif existing_google:
            user = existing_google
        else:
            if db.scalar(select(User.id).where(User.email == email)):
                return finish('conflict')
            name = claims.get('name')
            user = User(email=email, display_name=name.strip()[:120] if isinstance(name, str) and name.strip() else email[:120], role='learner', password_hash=hash_password(secrets.token_urlsafe(48)), google_sub=claims['sub'])
            db.add(user)
        db.commit()
        db.refresh(user)
        session, _ = create_session(user.id, user.password_hash)
        response = finish()
        response.set_cookie(SESSION_COOKIE, session, max_age=60 * 60 * 8, httponly=True, secure=secure_cookie(), samesite='lax', path='/')
        return response
    except (requests.RequestException, GoogleAuthError, ValueError, TypeError, KeyError, HTTPException, IntegrityError):
        db.rollback()
        return finish('failed')
