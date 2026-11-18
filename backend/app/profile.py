"""Authenticated avatar uploads; only normalized thumbnails are retained."""
import hmac
import io
import secrets
import warnings
import time
from collections import defaultdict
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from PIL import Image, ImageOps, UnidentifiedImageError
from sqlalchemy import select
from starlette.concurrency import run_in_threadpool

from app.auth import CurrentUser, SESSION_COOKIE
from app.dependencies import Db
from app.models import User
from app.schemas import UserOut, ProfileInput, PasswordInput, AuthSessionOut
from app.security import create_session, hash_password, verify_password
from app import verification as codes
from app.mail import mail_configured
import os

router = APIRouter(prefix='/api/v1/profile', tags=['profile'])
MAX_UPLOAD_BYTES = 5 * 1024 * 1024
MAX_AVATAR_PIXELS = 16_000_000
MAX_THUMBNAIL_BYTES = 60 * 1024
ALLOWED_FORMATS = {'image/jpeg': 'JPEG', 'image/png': 'PNG', 'image/webp': 'WEBP'}


def require_profile_write(request: Request, user: CurrentUser) -> User:
    csrf = request.headers.get('X-CSRF-Token', '')
    if not csrf or not hmac.compare_digest(csrf, request.state.session_claims['csrf']):
        raise HTTPException(status_code=403, detail='Yêu cầu xác thực CSRF không hợp lệ.')
    return user


ProfileWriter = Annotated[User, Depends(require_profile_write)]
_password_attempts = defaultdict(list)


@router.put('', response_model=UserOut)
def update_profile(payload: ProfileInput, db: Db, user: ProfileWriter):
    user.display_name = payload.display_name
    user.gender = payload.gender
    user.phone_number = payload.phone_number
    db.commit()
    return user


@router.post('/password/code')
def password_code(response: Response, db: Db, user: ProfileWriter):
    if not mail_configured():
        raise HTTPException(status_code=503, detail='Máy chủ chưa cấu hình gửi mã qua email.')
    token = codes.issue(db, 'password', user.email, {}, user)
    response.set_cookie(codes.COOKIE, token, max_age=600, httponly=True, secure=os.getenv('AUTH_COOKIE_SECURE', 'false').lower() == 'true', samesite='lax', path=codes.COOKIE_PATH)
    return {'csrf_token': codes.csrf_for(token), 'email': codes.mask(user.email), 'detail': 'Đã gửi mã xác thực đến email tài khoản.'}


@router.post('/password', response_model=AuthSessionOut)
def change_password(payload: PasswordInput, request: Request, response: Response, db: Db, user: ProfileWriter):
    timestamp = time.monotonic()
    attempts = [t for t in _password_attempts[user.id] if t > timestamp - 300]
    _password_attempts[user.id] = attempts
    if len(attempts) >= 5:
        raise HTTPException(status_code=429, detail='Bạn đã thử quá nhiều lần. Vui lòng thử lại sau 5 phút.')
    if payload.code:
        row, token, details = codes.pending(db, request)
        if row.purpose != 'password' or row.user_id != user.id:
            raise HTTPException(status_code=400, detail='Yêu cầu đổi mật khẩu không hợp lệ.')
        codes.require_unchanged_user(db, row, details)
        codes.check_codes(db, row, token, payload.code)
        row.consumed = True
    elif not user.password_enabled or not payload.current_password or not verify_password(payload.current_password, user.password_hash):
        attempts.append(timestamp)
        raise HTTPException(status_code=400, detail='Mật khẩu hiện tại không đúng. Bạn có thể xác thực bằng mã email.')
    if verify_password(payload.new_password, user.password_hash):
        raise HTTPException(status_code=422, detail='Mật khẩu mới cần khác mật khẩu hiện tại.')
    user.password_hash = hash_password(payload.new_password)
    user.password_enabled = True
    db.commit()
    _password_attempts.pop(user.id, None)
    session, csrf = create_session(user.id, user.password_hash)
    response.set_cookie(SESSION_COOKIE, session, max_age=28800, httponly=True, secure=os.getenv('AUTH_COOKIE_SECURE', 'false').lower() == 'true', samesite='lax', path='/')
    response.delete_cookie(codes.COOKIE, path=codes.COOKIE_PATH)
    return {'user': user, 'csrf_token': csrf}


def normalize_avatar(data: bytes, content_type: str) -> bytes:
    try:
        with warnings.catch_warnings():
            warnings.simplefilter('error', Image.DecompressionBombWarning)
            with Image.open(io.BytesIO(data)) as source:
                if source.format != ALLOWED_FORMATS[content_type]:
                    raise HTTPException(status_code=415, detail='Nội dung ảnh không khớp với định dạng đã chọn.')
                if source.width * source.height > MAX_AVATAR_PIXELS or min(source.size) < 32:
                    raise HTTPException(status_code=422, detail='Ảnh cần có kích thước tối thiểu 32 × 32 và không quá 16 triệu điểm ảnh.')
                if getattr(source, 'is_animated', False):
                    raise HTTPException(status_code=415, detail='Vui lòng chọn ảnh tĩnh JPEG, PNG hoặc WebP.')
                source.load()
                thumbnail = ImageOps.fit(ImageOps.exif_transpose(source).convert('RGBA'), (256, 256), method=Image.Resampling.LANCZOS)
                for quality in (85, 65, 45):
                    output = io.BytesIO()
                    thumbnail.save(output, format='WEBP', quality=quality, method=4, exif=b'', icc_profile=b'')
                    result = output.getvalue()
                    if len(result) <= MAX_THUMBNAIL_BYTES:
                        return result
    except HTTPException:
        raise
    except (UnidentifiedImageError, OSError, ValueError, SyntaxError, Image.DecompressionBombError, Image.DecompressionBombWarning) as exc:
        raise HTTPException(status_code=422, detail='Không đọc được ảnh. Hãy chọn một tệp JPEG, PNG hoặc WebP khác.') from exc
    raise HTTPException(status_code=422, detail='Không thể tối ưu ảnh này. Vui lòng chọn ảnh khác.')


def save_avatar(db, user: User, data: bytes, content_type: str) -> UserOut:
    user.avatar_image = normalize_avatar(data, content_type)
    user.avatar_version = secrets.token_hex(16)
    db.commit()
    return UserOut.model_validate(user)


@router.put('/avatar', response_model=UserOut)
async def upload_avatar(request: Request, db: Db, user: ProfileWriter):
    content_type = request.headers.get('Content-Type', '').split(';', 1)[0].strip().lower()
    if content_type not in ALLOWED_FORMATS:
        raise HTTPException(status_code=415, detail='Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP.')
    data = bytearray()
    async for chunk in request.stream():
        if len(data) + len(chunk) > MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=413, detail='Ảnh vượt quá 5 MB. Hãy chọn ảnh nhỏ hơn.')
        data.extend(chunk)
    if not data:
        raise HTTPException(status_code=400, detail='Tệp ảnh không được để trống.')
    return await run_in_threadpool(save_avatar, db, user, bytes(data), content_type)


@router.delete('/avatar', response_model=UserOut)
def remove_avatar(db: Db, user: ProfileWriter):
    user.avatar_image = None
    user.avatar_version = None
    db.commit()
    return user


@router.get('/avatar/{user_id}')
def get_avatar(user_id: int, db: Db, user: CurrentUser):
    if user.id != user_id:
        raise HTTPException(status_code=403, detail='Bạn chỉ có thể xem ảnh đại diện của tài khoản mình.')
    data = db.scalar(select(User.avatar_image).where(User.id == user_id))
    if not data:
        raise HTTPException(status_code=404, detail='Tài khoản chưa có ảnh đại diện.')
    return Response(content=data, media_type='image/webp', headers={'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'})
