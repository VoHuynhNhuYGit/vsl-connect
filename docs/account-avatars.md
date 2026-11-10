# Ảnh đại diện tài khoản

Trong `/dang-nhap`, tài khoản đã đăng nhập có thể chọn ảnh từ máy, xem trước khung tròn, điều chỉnh phóng to/vị trí và chọn **Lưu ảnh**. Chọn **Hủy** sẽ giữ ảnh đang lưu. Có thể thay hoặc xóa ảnh hiện tại. Ảnh trên thanh điều hướng cập nhật sau khi lưu.

- Định dạng đầu vào: JPEG, PNG, WebP; tối đa 5 MB.
- Trình duyệt cắt vùng vuông theo phần xem trước và tạo ảnh 512 × 512.
- Backend kiểm tra nội dung thực của ảnh, từ chối ảnh động và ảnh không hợp lệ; thu nhỏ thành WebP 256 × 256, không kèm EXIF/ICC và không quá 60 KiB.
- Ảnh nhỏ và mã phiên bản được lưu trong `users.avatar_image` và `users.avatar_version`. Cột ảnh được tải trì hoãn; danh sách người dùng/phiên đăng nhập chỉ trả URL, không trả dữ liệu ảnh.
- Migration `d82a_user_avatar` bổ sung hai cột nullable; giữ nguyên tài khoản hiện có. Docker Compose chạy migration trước khi khởi động backend. Khi chạy trực tiếp, dùng `alembic upgrade head` từ thư mục `backend`.

## API

| Phương thức | Đường dẫn | Hành vi |
| --- | --- | --- |
| PUT | `/api/v1/profile/avatar` | Nhận body ảnh trực tiếp, yêu cầu phiên đăng nhập và `X-CSRF-Token`; trả người dùng đã cập nhật. |
| DELETE | `/api/v1/profile/avatar` | Xóa ảnh của tài khoản hiện tại, yêu cầu phiên và CSRF; trả `avatar_url: null`. |
| GET | `/api/v1/profile/avatar/{user_id}` | Chỉ chủ tài khoản được xem ảnh; trả WebP với `Cache-Control: no-store` và `X-Content-Type-Options: nosniff`. |

`avatar_url` có tham số phiên bản để giao diện thay ảnh sau mỗi lần lưu. Đổi ảnh không thay mật khẩu, vai trò hoặc liên kết Google. Ảnh chỉ được gửi khi người dùng chọn lưu.

## Kiểm tra

Kiểm thử trong `backend/tests/test_backend.py` dùng SQLite tạm và migration thật: xác thực, CSRF, quyền chủ ảnh, loại/dung lượng/kích thước ảnh, chuẩn hóa, bỏ metadata, thay ảnh và xóa ảnh.

Kiểm thử trình duyệt dùng backend SQLite riêng và ảnh màu tổng hợp: chọn/hủy, điều chỉnh bằng bàn phím, lưu lỗi/thử lại, kiểm tra màu vùng cắt, cập nhật thanh điều hướng, tải lại/đăng nhập lại và bố cục sáng/tối ở các kích thước màn hình. Dữ liệu thử không ghi vào MySQL của dự án.
