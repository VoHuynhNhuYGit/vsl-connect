"""SMTP delivery with mandatory TLS; codes and credentials are never logged."""
import os
import smtplib
import ssl
from email.message import EmailMessage
from fastapi import HTTPException


def mail_configured() -> bool:
    return bool(all(os.getenv(key, '').strip() for key in ('SMTP_HOST', 'SMTP_FROM', 'SMTP_USERNAME', 'SMTP_PASSWORD'))
                and os.getenv('SMTP_SECURITY', 'starttls') in ('starttls', 'ssl'))


def send_verification_email(recipient: str, code: str):
    if not mail_configured():
        raise HTTPException(status_code=503, detail='Máy chủ chưa cấu hình gửi mã qua email. Vui lòng liên hệ quản trị viên.')
    message = EmailMessage()
    message['Subject'] = 'Mã xác thực tài khoản VSL Connect'
    message['From'] = os.environ['SMTP_FROM']
    message['To'] = recipient
    message.set_content(f'Mã xác thực VSL Connect của bạn là: {code}\n\nMã có hiệu lực 10 phút và chỉ sử dụng một lần. Không chia sẻ mã này. Nếu bạn không yêu cầu đăng nhập hoặc thay đổi tài khoản, hãy bỏ qua email này.')
    try:
        security = os.getenv('SMTP_SECURITY', 'starttls')
        port = int(os.getenv('SMTP_PORT') or ('465' if security == 'ssl' else '587'))
        context = ssl.create_default_context()
        connection = smtplib.SMTP_SSL(os.environ['SMTP_HOST'], port, timeout=10, context=context) if security == 'ssl' else smtplib.SMTP(os.environ['SMTP_HOST'], port, timeout=10)
        with connection as smtp:
            if security == 'starttls':
                smtp.ehlo()
                smtp.starttls(context=context)
                smtp.ehlo()
            username = os.getenv('SMTP_USERNAME', '')
            if username:
                smtp.login(username, os.getenv('SMTP_PASSWORD', ''))
            smtp.send_message(message)
    except (OSError, smtplib.SMTPException, ValueError) as exc:
        raise HTTPException(status_code=503, detail='Chưa gửi được mã xác thực. Vui lòng thử lại sau.') from exc
