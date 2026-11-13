"""Persistent, browser-bound one-time email challenges."""
import hashlib
import hmac
import json
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, Request
from sqlalchemy import delete, func, select
from app.models import AccountVerification, User
from app.security import _session_secret, credential_version
from app.mail import send_verification_email

COOKIE = 'vsl_account_verification'
COOKIE_PATH = '/api/v1'


def now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def digest(value: str) -> str:
    return hmac.new(_session_secret(), value.encode(), hashlib.sha256).hexdigest()


def mask(email: str) -> str:
    local, _, domain = email.partition('@')
    return f'{local[:1]}***@{domain}'


def csrf_for(token: str) -> str:
    return digest(f'csrf:{token}')


def issue(db, purpose: str, email: str, payload: dict, user: User | None = None, second_email: str | None = None):
    timestamp = now()
    db.execute(delete(AccountVerification).where(AccountVerification.created_at < timestamp - timedelta(days=1)))
    if user:
        user = db.scalar(select(User).where(User.id == user.id).with_for_update().execution_options(populate_existing=True))
        recent, oldest = db.execute(select(func.count(), func.min(AccountVerification.created_at)).where(AccountVerification.user_id == user.id, AccountVerification.created_at > timestamp - timedelta(hours=1))).one()
        if recent >= 5:
            retry = max(1, int((oldest + timedelta(hours=1) - timestamp).total_seconds()) + 1)
            raise HTTPException(status_code=429, detail='Bạn đã yêu cầu 5 mã trong một giờ. Vui lòng chờ trước khi yêu cầu mã mới.', headers={'Retry-After': str(retry)})
    # Limit unauthenticated requests for the same destination across OAuth attempts.
    email_key = digest('recipient:' + email.lower())
    recent, oldest = db.execute(select(func.count(), func.min(AccountVerification.created_at)).where(AccountVerification.recipient_hash == email_key, AccountVerification.created_at > timestamp - timedelta(hours=1))).one()
    if recent >= 5:
        retry = max(1, int((oldest + timedelta(hours=1) - timestamp).total_seconds()) + 1)
        raise HTTPException(status_code=429, detail='Email này đã nhận 5 yêu cầu mã trong một giờ. Vui lòng chờ trước khi yêu cầu mã mới.', headers={'Retry-After': str(retry)})
    token = secrets.token_urlsafe(32)
    code = f'{secrets.randbelow(1_000_000):06d}'
    second_email = second_email if second_email and second_email.lower() != email.lower() else None
    second = f'{secrets.randbelow(1_000_000):06d}' if second_email else None
    payload = {**payload, 'email': email, 'second_email': second_email, 'email_key': email_key,
               'credential': credential_version(user.password_hash) if user else None,
               'previous_google_sub': user.google_sub if user else None}
    row = AccountVerification(token_hash=digest(token), user_id=user.id if user else None, purpose=purpose, recipient_hash=email_key,
        payload=json.dumps(payload), code_hash=digest(f'{token}:{code}'), second_code_hash=digest(f'{token}:second:{second}') if second else None,
        attempts=0, expires_at=timestamp + timedelta(minutes=10), created_at=timestamp, sent_at=timestamp, send_count=1, consumed=False)
    db.add(row)
    db.commit()
    try:
        send_verification_email(email, code)
        if second:
            send_verification_email(second_email, second)
    except HTTPException:
        row.consumed = True
        db.commit()
        raise
    return token


def pending(db, request: Request, require_csrf: bool = False):
    token = request.cookies.get(COOKIE, '')
    if not token or len(token) > 100:
        raise HTTPException(status_code=400, detail='Không có yêu cầu xác thực. Hãy bắt đầu lại.')
    if require_csrf and not hmac.compare_digest(request.headers.get('X-CSRF-Token', ''), csrf_for(token)):
        raise HTTPException(status_code=403, detail='Yêu cầu xác thực CSRF không hợp lệ.')
    row = db.scalar(select(AccountVerification).where(AccountVerification.token_hash == digest(token)).with_for_update())
    if not row or row.consumed or row.expires_at <= now() or row.attempts >= 5:
        raise HTTPException(status_code=400, detail='Mã đã hết hạn hoặc vượt quá số lần thử. Hãy bắt đầu lại.')
    return row, token, json.loads(row.payload)


def check_codes(db, row, token, code, second_code=None):
    correct = hmac.compare_digest(row.code_hash, digest(f'{token}:{code}'))
    if row.second_code_hash:
        correct = correct and hmac.compare_digest(row.second_code_hash, digest(f'{token}:second:{second_code or ""}'))
    if not correct:
        row.attempts += 1
        db.commit()
        raise HTTPException(status_code=400, detail='Mã xác thực không đúng. Tối đa 5 lần thử.')


def require_unchanged_user(db, row, payload):
    user = db.scalar(select(User).where(User.id == row.user_id).with_for_update().execution_options(populate_existing=True))
    if not user or not hmac.compare_digest(payload['credential'], credential_version(user.password_hash)) or user.google_sub != payload['previous_google_sub']:
        raise HTTPException(status_code=409, detail='Thông tin tài khoản đã thay đổi. Hãy bắt đầu xác thực lại.')
    return user
