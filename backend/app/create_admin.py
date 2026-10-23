"""Create the first administrator without exposing a public registration route.

Run from the backend container or virtual environment:
``python -m app.create_admin --email admin@example.com``.
"""

import argparse
import getpass

from sqlalchemy import select

from app.db import get_db
from app.models import User
from app.security import hash_password


def main() -> None:
    parser = argparse.ArgumentParser(description='Create an administrator for VSL Connect.')
    parser.add_argument('--email', required=True, help='Administrator email address')
    parser.add_argument('--name', default='Quản trị viên', help='Display name')
    args = parser.parse_args()
    email = args.email.strip().lower()
    if '@' not in email or '.' not in email.partition('@')[2]:
        parser.error('Enter a valid email address.')
    password = getpass.getpass('Mật khẩu (ít nhất 12 ký tự): ')
    if not 12 <= len(password) <= 128:
        parser.error('Mật khẩu phải có từ 12 đến 128 ký tự.')
    if not args.name.strip() or len(args.name.strip()) > 120 or len(email) > 320:
        parser.error('Tên hoặc email không hợp lệ.')

    database = get_db()
    session = next(database)
    try:
        if session.scalar(select(User.id).where(User.email == email)):
            parser.error('Email này đã tồn tại; không thay đổi tài khoản hiện có.')
        session.add(User(email=email, display_name=args.name.strip(), password_hash=hash_password(password), role='admin'))
        session.commit()
    finally:
        database.close()
    print(f'Đã tạo tài khoản quản trị: {email}')


if __name__ == '__main__':
    main()
