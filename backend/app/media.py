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
        return (len(header) >= 12 and header[4:8] == b'ftyp') or (b'ftyp' in header[:32]) or (b'moov' in header[:32])
    if content_type == 'video/webm':
        return header.startswith(b'\x1a\x45\xdf\xa3')
    return False


def configuration() -> tuple[str, str, str]:
    cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME', '').strip()
    api_key = os.getenv('CLOUDINARY_API_KEY', '').strip()
    api_secret = os.getenv('CLOUDINARY_API_SECRET', '').strip()
    missing = []
    if not cloud_name:
        missing.append('CLOUDINARY_CLOUD_NAME')
    if not api_key:
        missing.append('CLOUDINARY_API_KEY')
    if not api_secret:
        missing.append('CLOUDINARY_API_SECRET')
    if missing:
        raise HTTPException(
            status_code=503,
            detail=f'Cloudinary chưa được cấu hình. Thiếu biến môi trường: {", ".join(missing)}.'
        )
    if not re.fullmatch(r'[A-Za-z0-9_-]+', cloud_name):
        raise HTTPException(
            status_code=503,
            detail='CLOUDINARY_CLOUD_NAME không hợp lệ (chỉ được chứa chữ cái, số, gạch dưới và gạch nối).'
        )
    return cloud_name, api_key, api_secret


def upload_to_cloudinary(file, content_type: str, resource_type: str, extension: str, config: tuple[str, str, str]):
    cloud_name, api_key, api_secret = config
    timestamp = str(int(time.time()))
    folder = os.getenv('CLOUDINARY_FOLDER', 'vsl-connect').strip()
    if folder:
        signed_fields = f'folder={folder}&timestamp={timestamp}'
        data = {'folder': folder, 'timestamp': timestamp, 'api_key': api_key}
    else:
        signed_fields = f'timestamp={timestamp}'
        data = {'timestamp': timestamp, 'api_key': api_key}
    signature = hashlib.sha1((signed_fields + api_secret).encode('utf-8')).hexdigest()
    data['signature'] = signature
    try:
        response = requests.post(
            f'https://api.cloudinary.com/v1_1/{cloud_name}/{resource_type}/upload',
            data=data,
            files={'file': (f'upload.{extension}', file, content_type)},
            timeout=(10, 180),
        )
        if not response.ok:
            err_msg = 'Không thể tải tệp lên Cloudinary.'
            try:
                err_data = response.json()
                if isinstance(err_data, dict) and 'error' in err_data:
                    c_msg = err_data['error'].get('message')
                    if c_msg:
                        err_msg = f'Lỗi Cloudinary ({response.status_code}): {c_msg}'
            except Exception:
                err_msg = f'Lỗi Cloudinary ({response.status_code}): {response.text[:200]}'
            raise HTTPException(status_code=502, detail=err_msg)

        result = response.json()
        url = result.get('secure_url')
        public_id = result.get('public_id')
        if not isinstance(url, str) or not url.startswith('https://') or not isinstance(public_id, str):
            raise ValueError('Phản hồi từ Cloudinary thiếu secure_url hoặc public_id hợp lệ.')
        return {'url': url, 'public_id': public_id, 'resource_type': resource_type}
    except HTTPException:
        raise
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f'Lỗi kết nối tới Cloudinary: {str(exc)}')
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f'Lỗi xử lý phản hồi từ Cloudinary: {str(exc)}')


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
