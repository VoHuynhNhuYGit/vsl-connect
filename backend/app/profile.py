"""Authenticated avatar uploads; only normalized thumbnails are retained."""
import hmac
import io
import secrets
import warnings
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from PIL import Image, ImageOps, UnidentifiedImageError
from sqlalchemy import select
from starlette.concurrency import run_in_threadpool

from app.auth import CurrentUser
from app.dependencies import Db
from app.models import User
from app.schemas import UserOut

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
