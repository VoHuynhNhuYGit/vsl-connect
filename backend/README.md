# Backend VSL Connect

Backend nền tảng dùng FastAPI, SQLAlchemy, MySQL và Alembic. Migration đầu tiên tạo bảng người dùng, khóa học, bài học, ký hiệu, ghi danh, tiến độ, bài kiểm tra và lịch ôn. Video và phụ đề được lưu dưới dạng đường dẫn, không lưu tệp trong MySQL. Chưa có dữ liệu mẫu.

Có thể chạy toàn bộ dự án bằng Docker Compose theo [hướng dẫn trong README chính](../README.md#chạy-bằng-docker-compose).

## Chạy trên Windows với PowerShell

Cần Python 3.10 trở lên và một MySQL đang chạy. Tạo một database **trống** với charset `utf8mb4` và một tài khoản MySQL có quyền tạo bảng trong database đó. Không dùng migration này trên database hiện có các bảng cùng tên nếu chưa kiểm tra và sao lưu.

Từ thư mục gốc dự án:

```powershell
python -m venv .venv
.\.venv\Scripts\python -m pip install -r backend\requirements-dev.txt
cd backend
$env:DATABASE_URL = 'mysql+pymysql://<user>:<password>@localhost:3306/<database>?charset=utf8mb4'
..\.venv\Scripts\python -m alembic upgrade head
..\.venv\Scripts\python -m uvicorn app.main:app --reload
```

Thay các giá trị trong ngoặc nhọn bằng thông tin MySQL thực tế; mã hóa URL cho các ký tự đặc biệt trong tên hoặc mật khẩu. `backend/.env.example` chỉ là mẫu: ứng dụng đọc biến môi trường, không tự tải tệp `.env`. Không đưa mật khẩu thật vào Git. MySQL phải được cấu hình múi giờ UTC; `DATETIME` không lưu múi giờ nên các giá trị phải được chuẩn hóa về UTC trước khi ghi.

API tài liệu tại `http://127.0.0.1:8000/docs`. Kiểm tra tiến trình qua `GET /health`, kiểm tra kết nối cơ sở dữ liệu qua `GET /health/ready`.

API công khai hiện có:

- `GET /api/v1/courses`, `GET /api/v1/courses/{slug}` và `GET /api/v1/courses/{slug}/lessons`.
- `GET /api/v1/signs` và `GET /api/v1/signs/{id}`. Danh sách hỗ trợ `q` và `region`.
- Các danh sách hỗ trợ `limit` (1–100, mặc định 20) và `offset` (mặc định 0). Chỉ nội dung đã xuất bản được trả về; một bài học còn cần khóa học tương ứng được xuất bản.

Chạy kiểm thử từ thư mục `backend`:

```powershell
..\.venv\Scripts\python -m pytest -q
```

Kiểm thử dùng SQLite tạm thời và áp dụng migration thật. Cần kiểm thử migration và luồng dữ liệu trên MySQL trước khi triển khai. Không dùng `alembic downgrade` với dữ liệu cần giữ: migration đầu tiên khi đảo ngược sẽ xóa các bảng.

Frontend đã kết nối API công khai cho khóa học, bài học của khóa học và từ điển. Hiện chưa có đăng ký, đăng nhập, API ghi/quản trị hay API dữ liệu cá nhân. Cần bổ sung xác thực, phân quyền, quản lý nội dung và cấu hình triển khai trước khi sử dụng với người dùng thật.
