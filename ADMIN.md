# Cấu hình khu vực quản trị

1. Trong `.env`, thêm `AUTH_TOKEN_SECRET` là một chuỗi bí mật ngẫu nhiên có ít nhất 32 ký tự. Có thể tạo chuỗi bằng `python -c "import secrets; print(secrets.token_urlsafe(48))"`, sau đó tự thêm giá trị vào `.env`. Không chia sẻ hoặc commit chuỗi này. Đặt `AUTH_COOKIE_SECURE=true` khi ứng dụng chạy qua HTTPS; để `false` khi chỉ thử nghiệm HTTP trên máy cục bộ.
2. Khởi động lại các dịch vụ: `docker compose up --build -d`. Compose chạy migration trước khi khởi động backend; tính năng quản trị sử dụng các bảng hiện có, không thêm migration.
3. Tạo quản trị viên đầu tiên bằng `docker compose exec backend python -m app.create_admin --email admin@example.com`. Thay email bằng email của bạn và nhập mật khẩu ít nhất 12 ký tự khi được hỏi. Lệnh không ghi đè tài khoản đã tồn tại.
4. Truy cập `http://admin.localhost:8080` và đăng nhập. Đường dẫn cũ `http://localhost:8080/admin` sẽ chuyển đến địa chỉ mới. Khu vực này quản lý khóa học, bài học, ký hiệu và người dùng. Bài học chỉ xuất hiện công khai khi cả bài và khóa học đều đã xuất bản. Phiên đăng nhập của `localhost` và `admin.localhost` độc lập; cần đăng nhập riêng tại trang quản trị.

Đối với backend chạy trực tiếp, thiết lập `DATABASE_URL` và `AUTH_TOKEN_SECRET` trong môi trường, chạy Alembic, sau đó chạy `python -m app.create_admin --email admin@example.com` từ thư mục `backend`.

Đây là thiết lập phát triển, chưa phải cấu hình bảo mật sản xuất: giới hạn đăng nhập hiện lưu trong bộ nhớ từng tiến trình; cookie phiên đã đăng xuất có thể bị dùng lại nếu bị sao chép trước khi hết hạn. Đổi mật khẩu hoặc xoay `AUTH_TOKEN_SECRET` sẽ vô hiệu hóa phiên tương ứng. Cần HTTPS, cơ chế thu hồi phiên phía server và giới hạn đăng nhập dùng chung trước khi triển khai thực tế.

## Đăng nhập Google

Trong Google Cloud Console, cấu hình OAuth consent screen, tạo OAuth client loại **Web application**, và khai báo authorized redirect URI `http://localhost:8080/api/v1/auth/google/callback` cho trang chính và `http://admin.localhost:8080/api/v1/auth/google/callback` cho trang quản trị. Cần kiểm tra Google Cloud Console có chấp nhận callback của subdomain localhost hay không. Với môi trường HTTPS khác, dùng URL callback của môi trường đó và khai báo chính xác trong Google Cloud Console. Nếu ứng dụng ở trạng thái thử nghiệm, thêm tài khoản Google vào danh sách test users.

Thêm `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` và `GOOGLE_ADMIN_REDIRECT_URI` vào `.env` (xem `.env.example`), sau đó chạy `docker compose up --build -d`. Không commit hoặc chia sẻ client secret. Compose tự chạy migration bổ sung Google ID; hãy sao lưu database trước khi áp dụng migration với dữ liệu quan trọng.

Vào `/dang-nhap` để đăng nhập. Google lần đầu tạo tài khoản học viên. Nếu email đã thuộc tài khoản VSL Connect, đăng nhập bằng mật khẩu tại `/dang-nhap` rồi chọn **Liên kết tài khoản Google**; hai email phải trùng nhau. Sau khi liên kết, tài khoản quản trị có thể dùng Google tại `http://admin.localhost:8080`. Hệ thống không tự liên kết theo email và không tự cấp quyền quản trị.

Đăng nhập Google sử dụng authorization code, state, PKCE và xác minh ID token. Nếu chưa cấu hình Google hoặc chưa được Google cho phép, chưa thể kiểm thử đăng nhập thực tế.

## Lưu ảnh và video trên Cloudinary

Tạo tài khoản Cloudinary, lấy **Cloud name**, **API key** và **API secret** trong Cloudinary Console. Thêm `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` và `CLOUDINARY_API_SECRET` vào `.env` theo `.env.example`; không commit hoặc chia sẻ API secret. Sau khi build image có tính năng này, khởi động lại backend và frontend bằng `docker compose up -d --no-deps --force-recreate backend frontend` để nạp cấu hình mới.

Đăng nhập quản trị, chọn **Hình ảnh & video**, chọn tệp và bấm **Tải lên Cloudinary**. Ở mục **Bài học**, bạn cũng có thể tải video trực tiếp vào biểu mẫu; bấm lưu bài học sau khi video tải xong. Với ký hiệu, sao chép URL video từ mục Hình ảnh & video và dán vào ô URL video. Ảnh JPEG, PNG, WebP, GIF tối đa 10 MB; video MP4, WebM, MOV tối đa 50 MB. Chỉ quản trị viên có phiên hợp lệ và CSRF token mới được tải lên.

Tệp được lưu công khai trên Cloudinary và có thể truy cập qua URL; không tải tài liệu nhạy cảm. Ứng dụng hiện không lưu danh sách thư viện hoặc xóa tệp trên Cloudinary: xem và quản lý các tệp đã tải trong Cloudinary Media Library. Tải tệp không tự lưu bài học hay xóa tệp cũ khi thay URL; tệp không dùng vẫn có thể chiếm dung lượng và phát sinh chi phí.
