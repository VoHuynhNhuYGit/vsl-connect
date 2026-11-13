# Hồ sơ, mật khẩu và xác thực Google

## Chức năng

- Người đã đăng nhập có thể sửa tên hiển thị, giới tính (không bắt buộc) và số điện thoại (không bắt buộc). Số điện thoại được chuẩn hóa, gồm 8–15 chữ số và có thể có dấu `+` đầu tiên. Email đăng nhập và vai trò không thể sửa từ API hồ sơ cá nhân.
- Đổi mật khẩu cần mật khẩu hiện tại hoặc mã gửi đến email tài khoản. Mật khẩu mới có 12–128 ký tự. Sau khi đổi, các cookie phiên cũ không còn hợp lệ; trình duyệt hiện tại nhận phiên và CSRF token mới.
- Google OAuth tiếp tục dùng authorization code, PKCE, state và nonce. Sau callback, chưa tạo tài khoản mới, chưa đăng nhập và chưa thay liên kết: trình duyệt được chuyển đến màn hình nhập mã.
- Đăng nhập Google cũng cần mã email. Khi liên kết/đổi sang Google có email khác email tài khoản, phải nhập hai mã độc lập, gửi đến hai địa chỉ. Tài khoản Google đã thuộc người khác không thể chuyển sang người dùng hiện tại.
- Hủy liên kết cần mật khẩu hiện tại và mã email. Người dùng Google mới chưa có mật khẩu phải đặt mật khẩu bằng mã email trước, để giữ phương thức đăng nhập dự phòng. Tài khoản Google từ phiên bản cũ vẫn có thể đặt lại mật khẩu qua email trong trang tài khoản nếu không biết mật khẩu hiện tại.

## Cấu hình SMTP tùy chỉnh và Google

Điền vào `.env` trên máy chủ, không đưa giá trị bí mật vào frontend hoặc Git:

```dotenv
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8080/api/v1/auth/google/callback
GOOGLE_ADMIN_REDIRECT_URI=http://127.0.0.1:8080/api/v1/auth/google/callback
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURITY=starttls
SMTP_USERNAME=your-brevo-smtp-login
SMTP_PASSWORD=your-brevo-smtp-key
SMTP_FROM=verified-sender@your-domain.example
```

Nhà cung cấp phải cho phép địa chỉ người gửi `SMTP_FROM`. Dùng `SMTP_SECURITY=ssl` và cổng nhà cung cấp chỉ định (thường 465) nếu cần TLS ngay từ đầu; `starttls` thường dùng cổng 587. Kết nối kiểm tra chứng chỉ TLS. Máy chủ không có chế độ gửi mã ra console, bỏ qua OTP hoặc gửi SMTP không mã hóa. Khi thiếu cấu hình, nút Google bị vô hiệu hóa và yêu cầu mã trả lỗi rõ ràng; sửa hồ sơ và đổi mật khẩu bằng mật khẩu hiện tại vẫn dùng được.

Đăng ký cả hai callback chính xác trong Google Cloud OAuth client. Bản triển khai HTTPS phải đổi callback, thiết lập `AUTH_COOKIE_SECURE=true` và dùng địa chỉ miền thật. Sau khi thay `.env`:

```powershell
docker compose up -d --force-recreate backend
```

Trong trang SMTP của Brevo, sao chép đúng **SMTP login** vào `SMTP_USERNAME`, **SMTP key** vào `SMTP_PASSWORD` (khác với API key và mật khẩu đăng nhập Brevo), rồi điền email người gửi đã xác minh vào `SMTP_FROM`. Đối chiếu [hướng dẫn SMTP chính thức của Brevo](https://help.brevo.com/hc/en-us/articles/7924908994450-Send-transactional-emails-using-Brevo-SMTP).

## Địa chỉ cục bộ

Trang học viên dùng `http://localhost:8080`; trang quản trị dùng `http://127.0.0.1:8080`. Google chấp nhận địa chỉ loopback cho môi trường phát triển, còn `admin.localhost` không đáp ứng quy tắc tên miền callback. Địa chỉ admin cũ tự chuyển sang `127.0.0.1`, giữ tham số URL. Hai địa chỉ giữ cookie phiên riêng; sau khi đổi địa chỉ admin, đăng nhập lại ở địa chỉ mới.

Tham chiếu: [Quy tắc redirect URI của Google](https://developers.google.com/identity/protocols/oauth2/web-server#uri-validation).

## Dữ liệu và giới hạn

Migration `e93b_account_security` bổ sung các cột tùy chọn và bảng `account_verifications`, không xóa dữ liệu cũ. Google định danh bằng `sub`; `google_email` lưu riêng với email đăng nhập.

Mã gồm sáu chữ số, có hạn 10 phút và tối đa năm lần thử. Gửi lại phải chờ 60 giây, tối đa ba lần gửi cho một yêu cầu; không kéo dài hạn dùng hoặc đặt lại số lần thử. Tối đa năm yêu cầu mới mỗi giờ cho tài khoản/địa chỉ đích. Bảng lưu HMAC của mã và token, không lưu mã nguyên văn. Cookie yêu cầu xác thực là HttpOnly/SameSite=Lax, các thao tác xác nhận có CSRF token riêng và kiểm tra chủ tài khoản. Các yêu cầu cũ bị từ chối nếu mật khẩu hoặc liên kết Google đã thay đổi. Xác nhận khóa bản ghi trong MySQL để mã chỉ dùng một lần. Yêu cầu cũ quá một ngày được dọn khi phát sinh yêu cầu mới.

Giới hạn thử mật khẩu được giữ theo tiến trình như giới hạn đăng nhập hiện có; giới hạn mã email lưu trong cơ sở dữ liệu. Mỗi trình duyệt chỉ có một yêu cầu xác thực đang chọn qua cookie, vì vậy bắt đầu yêu cầu khác có thể thay thế yêu cầu đang hiển thị ở tab trước.

## Thông báo giới hạn gửi mã

Hạn mức năm yêu cầu mới/giờ được dùng chung cho đăng nhập Google, liên kết, hủy liên kết và đổi mật khẩu của cùng tài khoản/địa chỉ đích. Mã đã dùng vẫn được tính vào hạn mức gửi. API trả `429` cùng `Retry-After`; callback OAuth chuyển thành `google_error=rate_limited` và thời gian chờ, thay vì báo chung là Google thất bại. Lỗi gửi email và phiên đăng nhập hết hạn cũng có thông báo riêng. Các kiểm thử chỉ sửa thời gian của bản ghi trong cơ sở dữ liệu tạm để kiểm tra cửa sổ hết hạn; không xóa giới hạn hay thay đổi yêu cầu thật của người dùng.

## Xác minh

Backend: `python -m pytest tests -q`. Kiểm thử dùng SQLite tạm, SMTP giả lập và Google claims giả lập; không gửi mã đến người thật. Kiểm tra trình duyệt riêng bao phủ sửa/lưu hồ sơ, đổi/đặt mật khẩu, cập nhật tên trên thanh điều hướng, nhập hai mã Google, thay/hủy liên kết và bố cục các chủ đề. Gửi mail thật và OAuth thật chỉ có thể xác minh sau khi cấu hình thông tin của nhà cung cấp.

Tài liệu tham chiếu: [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect), [Python 3.12 smtplib](https://docs.python.org/3.12/library/smtplib.html).
