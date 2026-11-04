"""Password and signed-session helpers for the administration API."""

import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from typing import Any


PASSWORD_ALGORITHM = 'scrypt'
SCRYPT_N = 2**14
SCRYPT_R = 8
SCRYPT_P = 1
SESSION_TTL_SECONDS = 60 * 60 * 8


def hash_password(password: str) -> str:
    """Hash a password with a per-password salt using Python's scrypt."""
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode('utf-8'), salt=salt, n=SCRYPT_N, r=SCRYPT_R, p=SCRYPT_P)
    return '$'.join((
        PASSWORD_ALGORITHM,
        str(SCRYPT_N),
        str(SCRYPT_R),
        str(SCRYPT_P),
        _encode(salt),
        _encode(digest),
    ))


def verify_password(password: str, password_hash: str) -> bool:
    """Validate a scrypt password hash without raising for malformed legacy data."""
    try:
        algorithm, n, r, p, encoded_salt, encoded_digest = password_hash.split('$')
        if algorithm != PASSWORD_ALGORITHM:
            return False
        expected = _decode(encoded_digest)
        actual = hashlib.scrypt(
            password.encode('utf-8'),
            salt=_decode(encoded_salt),
            n=int(n),
            r=int(r),
            p=int(p),
            dklen=len(expected),
        )
        return hmac.compare_digest(actual, expected)
    except (TypeError, ValueError):
        return False


def create_session(user_id: int, password_hash: str) -> tuple[str, str]:
    """Return a signed, expiring session and its CSRF secret."""
    csrf_token = secrets.token_urlsafe(32)
    payload = {
        'sub': user_id,
        'exp': int(time.time()) + SESSION_TTL_SECONDS,
        'csrf': csrf_token,
        'credential_version': credential_version(password_hash),
    }
    encoded_payload = _encode(json.dumps(payload, separators=(',', ':')).encode('utf-8'))
    signature = hmac.new(_session_secret(), encoded_payload.encode('ascii'), hashlib.sha256).digest()
    return f'v1.{encoded_payload}.{_encode(signature)}', csrf_token


def credential_version(password_hash: str) -> str:
    return hmac.new(_session_secret(), password_hash.encode('utf-8'), hashlib.sha256).hexdigest()


def sign_oauth_state(payload: dict[str, Any]) -> str:
    encoded = _encode(json.dumps(payload, separators=(',', ':')).encode('utf-8'))
    signature = hmac.new(_session_secret(), ('oauth.' + encoded).encode('ascii'), hashlib.sha256).digest()
    return f'{encoded}.{_encode(signature)}'


def read_oauth_state(value: str | None) -> dict[str, Any] | None:
    if not value:
        return None
    try:
        encoded, signature = value.split('.')
        expected = hmac.new(_session_secret(), ('oauth.' + encoded).encode('ascii'), hashlib.sha256).digest()
        if not hmac.compare_digest(expected, _decode(signature)):
            return None
        payload = json.loads(_decode(encoded))
        if not isinstance(payload, dict) or int(payload.get('exp', 0)) <= int(time.time()):
            return None
        return payload
    except (TypeError, ValueError, json.JSONDecodeError):
        return None


def read_session(session: str | None) -> dict[str, Any] | None:
    """Return validated claims from a session cookie, or ``None`` when invalid."""
    if not session:
        return None
    try:
        version, encoded_payload, encoded_signature = session.split('.')
        if version != 'v1':
            return None
        expected = hmac.new(_session_secret(), encoded_payload.encode('ascii'), hashlib.sha256).digest()
        if not hmac.compare_digest(expected, _decode(encoded_signature)):
            return None
        payload = json.loads(_decode(encoded_payload))
        if not isinstance(payload.get('sub'), int) or not isinstance(payload.get('csrf'), str):
            return None
        if int(payload.get('exp', 0)) <= int(time.time()):
            return None
        return payload
    except (TypeError, ValueError, json.JSONDecodeError):
        return None


def _session_secret() -> bytes:
    secret = os.environ.get('AUTH_TOKEN_SECRET')
    if not secret or len(secret) < 32:
        raise RuntimeError('AUTH_TOKEN_SECRET must contain at least 32 characters.')
    return secret.encode('utf-8')


def _encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b'=').decode('ascii')


def _decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + '=' * (-len(value) % 4))
