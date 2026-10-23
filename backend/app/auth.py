"""Session endpoints and dependencies shared by admin routes."""

import hmac
import os
import time
from collections import defaultdict
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy import select

from app.dependencies import Db
from app.models import User
from app.schemas import AuthSessionOut, LoginInput
from app.security import create_session, credential_version, read_session, verify_password


router = APIRouter(prefix='/api/v1/auth', tags=['authentication'])
SESSION_COOKIE = 'vsl_session'
MAX_LOGIN_ATTEMPTS = 5
LOGIN_WINDOW_SECONDS = 5 * 60
_login_attempts: dict[str, list[float]] = defaultdict(list)


def get_current_user(request: Request, db: Db) -> User:
    try:
        claims = read_session(request.cookies.get(SESSION_COOKIE))
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail='Xác thực chưa được cấu hình.') from exc
    if not claims:
        raise HTTPException(status_code=401, detail='Bạn cần đăng nhập để tiếp tục.')
    user = db.get(User, claims['sub'])
    if not user or not hmac.compare_digest(str(claims.get('credential_version', '')), credential_version(user.password_hash)):
        raise HTTPException(status_code=401, detail='Phiên đăng nhập không còn hợp lệ.')
    request.state.session_claims = claims
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_admin(user: CurrentUser) -> User:
    if user.role != 'admin':
        raise HTTPException(status_code=403, detail='Bạn không có quyền quản trị.')
    return user


AdminUser = Annotated[User, Depends(require_admin)]


def require_admin_write(request: Request, user: AdminUser) -> User:
    claims = request.state.session_claims
    csrf_token = request.headers.get('X-CSRF-Token')
    if not csrf_token or csrf_token != claims['csrf']:
        raise HTTPException(status_code=403, detail='Yêu cầu xác thực CSRF không hợp lệ.')
    return user


AdminWriter = Annotated[User, Depends(require_admin_write)]


@router.post('/login', response_model=AuthSessionOut)
def login(credentials: LoginInput, request: Request, response: Response, db: Db):
    client_key = request.client.host if request.client else 'unknown'
    now = time.monotonic()
    attempts = [attempt for attempt in _login_attempts[client_key] if now - attempt < LOGIN_WINDOW_SECONDS]
    _login_attempts[client_key] = attempts
    if len(attempts) >= MAX_LOGIN_ATTEMPTS:
        raise HTTPException(status_code=429, detail='Thử lại sau vài phút.')

    user = db.scalar(select(User).where(User.email == credentials.email.strip().lower()))
    if not user or not verify_password(credentials.password, user.password_hash):
        attempts.append(now)
        _login_attempts[client_key] = attempts
        raise HTTPException(status_code=401, detail='Email hoặc mật khẩu không chính xác.')

    try:
        session, csrf_token = create_session(user.id, user.password_hash)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail='Xác thực chưa được cấu hình.') from exc
    _login_attempts.pop(client_key, None)
    response.set_cookie(
        key=SESSION_COOKIE,
        value=session,
        max_age=60 * 60 * 8,
        httponly=True,
        secure=os.environ.get('AUTH_COOKIE_SECURE', 'false').lower() == 'true',
        samesite='lax',
        path='/',
    )
    return AuthSessionOut(user=user, csrf_token=csrf_token)


@router.get('/me', response_model=AuthSessionOut)
def me(request: Request, user: CurrentUser):
    return AuthSessionOut(user=user, csrf_token=request.state.session_claims['csrf'])


@router.post('/logout', status_code=204)
def logout(request: Request, response: Response, user: CurrentUser):
    csrf_token = request.headers.get('X-CSRF-Token')
    if not csrf_token or csrf_token != request.state.session_claims['csrf']:
        raise HTTPException(status_code=403, detail='Yêu cầu xác thực CSRF không hợp lệ.')
    response.delete_cookie(SESSION_COOKIE, path='/')
