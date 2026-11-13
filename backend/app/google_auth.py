"""Google authorization-code login and explicit account linking."""

import base64
import hashlib
import hmac
import os
import secrets
import time
import logging
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
from app.security import create_session, hash_password, read_oauth_state, sign_oauth_state, verify_password
from app import verification as codes
from app.mail import mail_configured
from app.schemas import VerificationInput, AuthSessionOut, UnlinkInput
from datetime import timedelta
from collections import defaultdict

router = APIRouter(prefix='/api/v1/auth/google', tags=['authentication'])
STATE_COOKIE = 'vsl_google_oauth'
DEFAULT_REDIRECT_URI = 'http://localhost:8080/api/v1/auth/google/callback'
DEFAULT_ADMIN_REDIRECT_URI = 'http://127.0.0.1:8080/api/v1/auth/google/callback'
_unlink_attempts = defaultdict(list)
logger = logging.getLogger(__name__)


def is_admin_host(request: Request) -> bool:
    admin_uri = os.getenv('GOOGLE_ADMIN_REDIRECT_URI', DEFAULT_ADMIN_REDIRECT_URI).strip()
    return bool(urlparse(admin_uri).hostname and request.url.hostname == urlparse(admin_uri).hostname)


def configuration(admin_origin: bool = False):
    client_id = os.getenv('GOOGLE_CLIENT_ID', '').strip()
    client_secret = os.getenv('GOOGLE_CLIENT_SECRET', '').strip()
    redirect_uri = os.getenv('GOOGLE_ADMIN_REDIRECT_URI', DEFAULT_ADMIN_REDIRECT_URI).strip() if admin_origin else os.getenv('GOOGLE_REDIRECT_URI', DEFAULT_REDIRECT_URI).strip()
    uri = urlparse(redirect_uri)
    if not client_id or not client_secret or not uri.netloc or uri.path != '/api/v1/auth/google/callback' or uri.query or uri.fragment:
        raise HTTPException(status_code=503, detail='Đăng nhập Google chưa được cấu hình.')
    if uri.hostname == 'admin.localhost':
        raise HTTPException(status_code=503, detail='Google không chấp nhận admin.localhost. Hãy dùng 127.0.0.1 cho callback admin cục bộ.')
    if uri.scheme != 'https' and not (uri.scheme == 'http' and uri.hostname in ('localhost', '127.0.0.1')):
        raise HTTPException(status_code=503, detail='Địa chỉ callback Google phải dùng HTTPS.')
    return client_id, client_secret, redirect_uri


def secure_cookie() -> bool:
    return os.getenv('AUTH_COOKIE_SECURE', 'false').lower() == 'true'


@router.get('/status')
def status(request: Request):
    try:
        configuration(is_admin_host(request))
        return {'configured': mail_configured(), 'oauth_configured': True, 'email_configured': mail_configured()}
    except HTTPException:
        return {'configured': False, 'oauth_configured': False, 'email_configured': mail_configured()}


def start_flow(purpose: str, user_id: int | None = None, admin_origin: bool = False):
    client_id, _, redirect_uri = configuration(admin_origin)
    state = secrets.token_urlsafe(32)
    nonce = secrets.token_urlsafe(32)
    verifier = secrets.token_urlsafe(64)
    challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode('ascii')).digest()).rstrip(b'=').decode('ascii')
    payload = {'state': state, 'nonce': nonce, 'verifier': verifier, 'purpose': purpose, 'user_id': user_id, 'admin_origin': admin_origin, 'exp': int(time.time()) + 600}
    params = {'client_id': client_id, 'redirect_uri': redirect_uri, 'response_type': 'code', 'scope': 'openid email profile', 'state': state, 'nonce': nonce, 'code_challenge': challenge, 'code_challenge_method': 'S256', 'prompt': 'select_account'}
    response = JSONResponse({'url': 'https://accounts.google.com/o/oauth2/v2/auth?' + urlencode(params)})
    response.set_cookie(STATE_COOKIE, sign_oauth_state(payload), max_age=600, httponly=True, secure=secure_cookie(), samesite='lax', path='/api/v1/auth/google')
    response.headers['Cache-Control'] = 'no-store'
    return response


@router.get('/start')
def start(request: Request, return_to: str = 'login'):
    if return_to not in ('login', 'admin'):
        raise HTTPException(status_code=400, detail='Trang đích không hợp lệ.')
    if not mail_configured():
        raise HTTPException(status_code=503, detail='Máy chủ chưa cấu hình gửi mã qua email.')
    return start_flow(return_to, admin_origin=is_admin_host(request))


@router.post('/link')
def link(request: Request, user: CurrentUser):
    if not hmac.compare_digest(request.headers.get('X-CSRF-Token', ''), request.state.session_claims['csrf']):
        raise HTTPException(status_code=403, detail='Yêu cầu xác thực CSRF không hợp lệ.')
    if not mail_configured():
        raise HTTPException(status_code=503, detail='Máy chủ chưa cấu hình gửi mã qua email.')
    return start_flow('link', user.id, is_admin_host(request))


@router.post('/unlink')
def unlink(request: Request, user: CurrentUser, db: Db, payload: UnlinkInput | None = None):
    if not hmac.compare_digest(request.headers.get('X-CSRF-Token', ''), request.state.session_claims['csrf']):
        raise HTTPException(status_code=403, detail='Yêu cầu xác thực CSRF không hợp lệ.')
    if not user.google_sub:
        raise HTTPException(status_code=400, detail='Tài khoản chưa liên kết Google.')
    if not user.password_enabled:
        raise HTTPException(status_code=400, detail='Hãy đặt mật khẩu bằng mã email trước khi hủy phương thức đăng nhập Google.')
    timestamp = time.monotonic()
    attempts = [t for t in _unlink_attempts[user.id] if t > timestamp - 300]
    _unlink_attempts[user.id] = attempts
    if len(attempts) >= 5:
        raise HTTPException(status_code=429, detail='Bạn đã thử quá nhiều lần. Hãy thử lại sau 5 phút.')
    if not payload or not verify_password(payload.current_password, user.password_hash):
        attempts.append(timestamp)
        raise HTTPException(status_code=400, detail='Nhập mật khẩu hiện tại để xác nhận bạn vẫn có thể đăng nhập sau khi hủy Google.')
    _unlink_attempts.pop(user.id, None)
    token = codes.issue(db, 'unlink', user.email, {}, user)
    response = JSONResponse({'detail': 'Đã gửi mã xác thực để hủy liên kết.'})
    set_pending_cookie(response, token)
    return response


def set_pending_cookie(response, token):
    response.set_cookie(codes.COOKIE, token, max_age=600, httponly=True, secure=secure_cookie(), samesite='lax', path=codes.COOKIE_PATH)
    response.headers['Cache-Control'] = 'no-store'


def pending_challenge(request, db, require_csrf=False):
    row, token, details = codes.pending(db, request, require_csrf)
    if row.purpose != 'google_login':
        user = get_current_user(request, db)
        if row.user_id != user.id:
            raise HTTPException(status_code=403, detail='Yêu cầu xác thực không thuộc tài khoản này.')
    return row, token, details


@router.get('/pending')
def pending_status(request: Request, db: Db):
    row, token, details = pending_challenge(request, db)
    response = JSONResponse({'purpose': row.purpose, 'email': codes.mask(details['email']),
        'google_email': codes.mask(details['second_email']) if details.get('second_email') else None,
        'csrf_token': codes.csrf_for(token), 'expires_in': max(0, int((row.expires_at - codes.now()).total_seconds())),
        'resend_after': max(0, 60 - int((codes.now() - row.sent_at).total_seconds()))})
    response.headers['Cache-Control'] = 'no-store'
    return response


@router.post('/cancel')
def cancel_pending(request: Request, db: Db):
    row, _, _ = pending_challenge(request, db, True)
    row.consumed = True
    db.commit()
    response = JSONResponse({'detail': 'Đã hủy yêu cầu xác thực.'})
    response.delete_cookie(codes.COOKIE, path=codes.COOKIE_PATH)
    return response


@router.post('/resend')
def resend_pending(request: Request, db: Db):
    row, token, details = pending_challenge(request, db, True)
    if codes.now() - row.sent_at < timedelta(seconds=60) or row.send_count >= 3:
        raise HTTPException(status_code=429, detail='Chờ ít nhất 60 giây giữa các lần gửi; tối đa 3 lần mỗi yêu cầu.')
    code = f'{secrets.randbelow(1_000_000):06d}'
    second = f'{secrets.randbelow(1_000_000):06d}' if row.second_code_hash else None
    row.code_hash = codes.digest(f'{token}:{code}')
    row.second_code_hash = codes.digest(f'{token}:second:{second}') if second else None
    row.sent_at = codes.now()
    row.send_count += 1
    # Keep the original expiry and attempt count so resending cannot bypass limits.
    db.commit()
    codes.send_verification_email(details['email'], code)
    if second:
        codes.send_verification_email(details['second_email'], second)
    return {'detail': 'Đã gửi mã mới. Mã cũ không còn hiệu lực.'}


@router.post('/verify', response_model=AuthSessionOut)
def verify_pending(payload: VerificationInput, request: Request, db: Db):
    row, token, details = pending_challenge(request, db, True)
    if row.purpose not in ('google_login', 'google_link', 'unlink'):
        raise HTTPException(status_code=400, detail='Yêu cầu xác thực không hợp lệ.')
    codes.check_codes(db, row, token, payload.code, payload.google_code)
    user = codes.require_unchanged_user(db, row, details) if row.user_id else None
    try:
        if row.purpose == 'unlink':
            if not user.password_enabled:
                raise HTTPException(status_code=400, detail='Hãy đặt mật khẩu trước khi hủy liên kết Google.')
            user.google_sub = None
            user.google_email = None
        else:
            owner = db.scalar(select(User).where(User.google_sub == details['google_sub']))
            email_owner = db.scalar(select(User).where(User.email == details['google_email']))
            if (owner and (not user or owner.id != user.id)) or (email_owner and (not user or email_owner.id != user.id)):
                raise HTTPException(status_code=409, detail='Tài khoản Google này đã thuộc một tài khoản khác.')
            if not user:
                user = User(email=details['google_email'], display_name=details['name'], role='learner', password_hash=hash_password(secrets.token_urlsafe(48)), password_enabled=False)
                db.add(user)
            user.google_sub = details['google_sub']
            user.google_email = details['google_email']
        row.consumed = True
        db.commit()
        db.refresh(user)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail='Thông tin liên kết đã thay đổi. Hãy thử lại.') from exc
    session, csrf = create_session(user.id, user.password_hash)
    response = JSONResponse(AuthSessionOut(user=user, csrf_token=csrf).model_dump(mode='json'))
    response.set_cookie(SESSION_COOKIE, session, max_age=28800, httponly=True, secure=secure_cookie(), samesite='lax', path='/')
    response.delete_cookie(codes.COOKIE, path=codes.COOKIE_PATH)
    response.headers['Cache-Control'] = 'no-store'
    return response


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

    def finish(error_code: str | None = None, pending: bool = False, retry_after: str | None = None):
        query = f'?google_error={error_code}' if error_code else '?google_pending=1' if pending else '?google_success=1'
        if retry_after and retry_after.isdigit():
            query += f'&retry_after={retry_after}'
        result = RedirectResponse(destination + query, status_code=303)
        result.delete_cookie(STATE_COOKIE, path='/api/v1/auth/google')
        result.headers['Cache-Control'] = 'no-store'
        result.headers['Referrer-Policy'] = 'no-referrer'
        return result

    if not payload or not state or not hmac.compare_digest(str(payload.get('state', '')), state) or not code or error:
        return finish('invalid')
    if purpose not in ('admin', 'login', 'link') or bool(payload.get('admin_origin', False)) != admin_origin:
        return finish('invalid')
    stage = 'identity'
    try:
        claims = verify_google_code(code, payload['verifier'], payload['nonce'], admin_origin)
        email = claims['email'].strip().lower()
        existing_google = db.scalar(select(User).where(User.google_sub == claims['sub']))
        if purpose == 'link':
            user = get_current_user(request, db)
            email_owner = db.scalar(select(User).where(User.email == email))
            if user.id != payload['user_id'] or (existing_google and existing_google.id != user.id) or (email_owner and email_owner.id != user.id):
                return finish('conflict')
        elif existing_google:
            user = existing_google
        else:
            user = db.scalar(select(User).where(User.email == email))
            if user and user.google_sub and user.google_sub != claims['sub']:
                return finish('conflict')
        name = claims.get('name')
        stage = 'email'
        token = codes.issue(db, 'google_link' if purpose == 'link' else 'google_login', user.email if user else email,
            {'google_sub': claims['sub'], 'google_email': email, 'name': name.strip()[:120] if isinstance(name, str) and name.strip() else email[:120]}, user, email)
        response = finish(pending=True)
        set_pending_cookie(response, token)
        return response
    except HTTPException as exc:
        db.rollback()
        category = 'rate_limited' if exc.status_code == 429 else 'session_expired' if exc.status_code == 401 else 'email_unavailable' if stage == 'email' and exc.status_code == 503 else 'failed'
        logger.warning('google_oauth_callback_failed category=%s status=%s', category, exc.status_code)
        return finish(category, retry_after=(exc.headers or {}).get('Retry-After'))
    except (requests.RequestException, GoogleAuthError, ValueError, TypeError, KeyError, IntegrityError) as exc:
        db.rollback()
        logger.warning('google_oauth_callback_failed category=provider exception_type=%s', type(exc).__name__)
        return finish('failed')
