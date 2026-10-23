"""Authenticated, size-limited uploads to Cloudinary."""

import hashlib
import os
import re
import tempfile
import time

import requests
from fastapi import APIRouter, HTTPException, Request
from starlette.concurrency import run_in_threadpool

from app.auth import AdminWriter

router = APIRouter(prefix='/api/v1/admin/media', tags=['administration'])

FORMATS = {
    'image/jpeg': ('image', 'jpg', 10 * 1024 * 1024),
    'image/png': ('image', 'png', 10 * 1024 * 1024),
    'image/webp': ('image', 'webp', 10 * 1024 * 1024),
    'image/gif': ('image', 'gif', 10 * 1024 * 1024),
    'video/mp4': ('video', 'mp4', 50 * 1024 * 1024),
    'video/webm': ('video', 'webm', 50 * 1024 * 1024),
    'video/quicktime': ('video', 'mov', 50 * 1024 * 1024),
}


def valid_header(content_type: str, header: bytes) -> bool:
    if content_type == 'image/jpeg':
        return header.startswith(b'\xff\xd8\xff')
    if content_type == 'image/png':
        return header.startswith(b'\x89PNG\r\n\x1a\n')
    if content_type == 'image/webp':
        return header.startswith(b'RIFF') and header[8:12] == b'WEBP'
    if content_type == 'image/gif':
        return header.startswith((b'GIF87a', b'GIF89a'))
    if content_type in ('video/mp4', 'video/quicktime'):
        return len(header) >= 12 and header[4:8] == b'ftyp'
    if content_type == 'video/webm':
        return header.startswith(b'\x1a\x45\xdf\xa3')
    return False


def configuration() -> tuple[str, str, str]:
    cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME', '').strip()
    api_key = os.getenv('CLOUDINARY_API_KEY', '').strip()
    api_secret = os.getenv('CLOUDINARY_API_SECRET', '').strip()
    if not re.fullmatch(r'[A-Za-z0-9_-]+', cloud_name) or not api_key or not api_secret:
        raise HTTPException(status_code=503, detail='Cloudinary chưa được cấu hình.')
    return cloud_name, api_key, api_secret


def upload_to_cloudinary(file, content_type: str, resource_type: str, extension: str, config: tuple[str, str, str]):
    cloud_name, api_key, api_secret = config
    timestamp = str(int(time.time()))
    signed_fields = f'folder=vsl-connect&timestamp={timestamp}'
    signature = hashlib.sha1((signed_fields + api_secret).encode('utf-8')).hexdigest()
    try:
        response = requests.post(
            f'https://api.cloudinary.com/v1_1/{cloud_name}/{resource_type}/upload',
            data={'folder': 'vsl-connect', 'timestamp': timestamp, 'api_key': api_key, 'signature': signature},
            files={'file': (f'upload.{extension}', file, content_type)},
            timeout=(10, 180),
        )
        response.raise_for_status()
        result = response.json()
        url = result.get('secure_url')
        public_id = result.get('public_id')
        if not isinstance(url, str) or not url.startswith('https://res.cloudinary.com/') or not isinstance(public_id, str) or result.get('resource_type') != resource_type:
            raise ValueError('Invalid Cloudinary response')
        return {'url': url, 'public_id': public_id, 'resource_type': resource_type}
    except (requests.RequestException, ValueError, TypeError, AttributeError):
        raise HTTPException(status_code=502, detail='Không thể tải tệp lên Cloudinary. Vui lòng thử lại.')


@router.post('/upload', status_code=201)
async def upload(request: Request, _admin: AdminWriter):
    content_type = request.headers.get('content-type', '').split(';', 1)[0].strip().lower()
    if content_type not in FORMATS:
        raise HTTPException(status_code=415, detail='Chỉ hỗ trợ ảnh JPEG, PNG, WebP, GIF hoặc video MP4, WebM, MOV.')
    resource_type, extension, max_bytes = FORMATS[content_type]
    config = configuration()
    with tempfile.SpooledTemporaryFile(max_size=1024 * 1024, mode='w+b') as file:
        size = 0
        async for chunk in request.stream():
            size += len(chunk)
            if size > max_bytes:
                raise HTTPException(status_code=413, detail='Tệp vượt quá giới hạn dung lượng cho phép.')
            file.write(chunk)
        if not size:
            raise HTTPException(status_code=400, detail='Tệp không được để trống.')
        file.seek(0)
        if not valid_header(content_type, file.read(32)):
            raise HTTPException(status_code=415, detail='Nội dung tệp không khớp với định dạng đã chọn.')
        file.seek(0)
        return await run_in_threadpool(upload_to_cloudinary, file, content_type, resource_type, extension, config)
