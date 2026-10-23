# VSL Connect — Nền tảng học Ngôn ngữ ký hiệu Việt Nam

> **Trạng thái:** Đang phát triển. Tài liệu này mô tả kiến trúc và phạm vi **dự kiến**, không khẳng định các tính năng đã được triển khai.

**VSL Connect** là nền tảng web hỗ trợ học, ôn tập và thực hành Ngôn ngữ ký hiệu Việt Nam (VSL). Dự án hướng đến trải nghiệm học tập trực quan với video minh họa, bài kiểm tra, theo dõi tiến độ và các tính năng AI hỗ trợ nhận diện ký hiệu trong những giai đoạn sau.

## 1. Mục tiêu

- Cung cấp lộ trình học VSL có cấu trúc, dễ tiếp cận.
- Xây dựng từ điển ký hiệu có video và thông tin nguồn/kiểm duyệt.
- Hỗ trợ ghi nhớ qua thẻ học, trắc nghiệm và ôn tập ngắt quãng.
- Theo dõi quá trình học và khuyến khích duy trì thói quen.
- Nghiên cứu nhận diện một **tập ký hiệu giới hạn** bằng camera và AI.
- Từng bước hỗ trợ giao tiếp qua video call với phụ đề nhận diện, không mặc định là hệ thống dịch VSL hoàn chỉnh.

## 2. Phạm vi chức năng

| # | Nhóm chức năng | Nội dung chính | Giai đoạn |
|---|---|---|---|
| 1 | Trang chủ và giới thiệu | Giới thiệu, điều hướng, khóa học nổi bật | V1 |
| 2 | Tài khoản và hồ sơ | Đăng ký, đăng nhập, cài đặt, phân quyền | V1 |
| 3 | Khóa học và bài học | Danh mục, chương, bài, ghi danh | V1 |
| 4 | Video hướng dẫn ký hiệu | Xem video, phát chậm, lặp lại, điều hướng | V1 |
| 5 | Từ điển VSL | Tìm kiếm, lọc chủ đề, xem ký hiệu | V1 |
| 6 | Thẻ ghi nhớ và trắc nghiệm | Luyện nhớ, kiểm tra, xem kết quả | V1 |
| 7 | Tiến độ học tập | Bài đã học, điểm số, biểu đồ | V1 |
| 8 | Quản trị nội dung | Quản lý khóa học, ký hiệu, video, người dùng | V1 |
| 9 | Ôn tập ngắt quãng | Lịch ôn, đánh giá mức độ ghi nhớ | V1 |
| 10 | Luyện tập camera + AI | Nhận diện ký hiệu trong phạm vi model hỗ trợ | V2 |
| 11 | Video call + phụ đề AI | WebRTC, chat, phụ đề ký hiệu giới hạn | V3 |
| 12 | Thành tích và huy hiệu | Mốc hoàn thành, phần thưởng học tập | V1 |

**V1:** Website học tập hoàn chỉnh. **V2:** Tích hợp AI luyện tập. **V3:** Giao tiếp video có hỗ trợ AI.

## 3. Danh sách 36 giao diện dự kiến

### Trang công khai (6)
1. Trang chủ — `/`
2. Giới thiệu — `/about`
3. Danh sách khóa học — `/courses`
4. Chi tiết khóa học — `/courses/:slug`
5. Từ điển ký hiệu — `/dictionary`
6. Chi tiết ký hiệu — `/dictionary/:id`

### Tài khoản (6)
7. Đăng nhập — `/login`
8. Đăng ký — `/register`
9. Quên mật khẩu — `/forgot-password`
10. Đặt lại mật khẩu — `/reset-password`
11. Hồ sơ cá nhân — `/profile`
12. Cài đặt — `/settings`

### Học tập (3)
13. Tổng quan học tập — `/dashboard`
14. Khóa học của tôi — `/my-learning`
15. Giao diện học bài — `/learn/:lessonId`

### Luyện tập (7)
16. Trung tâm luyện tập — `/practice`
17. Thẻ ghi nhớ — `/practice/flashcards`
18. Danh sách bài kiểm tra — `/practice/quizzes`
19. Làm bài kiểm tra — `/practice/quizzes/:id`
20. Kết quả kiểm tra — `/practice/results/:attemptId`
21. Ôn tập ngắt quãng — `/review`
22. Luyện tập camera AI — `/practice/camera`

### Tiến độ và thành tích (2)
23. Tiến độ học tập — `/progress`
24. Thành tích và huy hiệu — `/achievements`

### Giao tiếp (3)
25. Phòng chờ gọi video — `/calls`
26. Phòng gọi video — `/calls/:roomId`
27. Lịch sử cuộc gọi — `/calls/history`

### Quản trị (9)
28. Tổng quan quản trị — `/admin`
29. Quản lý khóa học — `/admin/courses`
30. Quản lý bài học — `/admin/lessons`
31. Quản lý ký hiệu — `/admin/signs`
32. Quản lý video — `/admin/media`
33. Quản lý bài kiểm tra — `/admin/quizzes`
34. Quản lý người dùng — `/admin/users`
35. Kiểm duyệt nội dung — `/admin/reviews`
36. Thống kê hệ thống — `/admin/analytics`

> Có thể bổ sung trang **Lộ trình học tập** (`/learning-path`) thành giao diện thứ 37 khi chốt thiết kế. Các trang 403/404/500 và trạng thái lỗi là giao diện hỗ trợ, không tính vào 36 trang trên.

## 4. Nguyên tắc thiết kế UI/UX

- **Toàn bộ nội dung hiển thị bằng tiếng Việt** có dấu; tên thương hiệu **VSL Connect** được giữ nguyên.
- **Ưu tiên website máy tính**, thiết kế ở khung tham chiếu khoảng **1440 px**; sau đó tối ưu tablet/mobile.
- **Thanh điều hướng chính nằm ngang phía trên**, không dùng sidebar dọc làm menu chính của khu vực học viên.
- Thiết kế như **ứng dụng học tập tương tác**, không giống blog hoặc trang đọc báo.
- Video ký hiệu là trọng tâm; không che bàn tay, khuôn mặt và chuyển động bằng chữ hay nút nổi.
- Hỗ trợ bàn phím, trạng thái focus, thông báo bằng chữ và tương phản màu phù hợp.

**Bảng màu tham chiếu:**

| Thành phần | Màu |
|---|---|
| Chính | `#438B88` |
| Chính khi hover | `#367572` |
| Nền nhạt | `#E8F4F2` |
| Nền trang | `#F8FAFA` |
| Thẻ nội dung | `#FFFFFF` |
| Chữ chính | `#243746` |
| Chữ phụ | `#64748B` |
| Đường viền | `#E4ECEB` |

Font tham chiếu: **Be Vietnam Pro**. Có thể điều chỉnh token thiết kế sau khi duyệt mẫu Stitch cuối cùng.

## 5. Công nghệ dự kiến

| Thành phần | Công nghệ |
|---|---|
| Frontend | React, TypeScript, Vite |
| Giao diện | Tailwind CSS, shadcn/ui, Lucide |
| Điều hướng | React Router |
| Dữ liệu phía client | TanStack Query |
| Biểu mẫu | React Hook Form, Zod |
| Backend | Python, FastAPI, Pydantic |
| Cơ sở dữ liệu | MySQL, SQLAlchemy, Alembic |
| AI (sau) | MediaPipe, OpenCV, PyTorch; cân nhắc ONNX Runtime Web |
| Gọi video (sau) | WebRTC, WebSocket signaling, STUN/TURN |
| Triển khai | Docker Compose, Nginx, HTTPS, VPS |
| Kiểm thử | Vitest, Playwright, pytest |

## 6. Cấu trúc thư mục mục tiêu

```text
vsl-connect/
├── frontend/                 # React + TypeScript
│   ├── public/
│   └── src/
│       ├── app/
│       ├── components/
│       ├── features/
│       ├── hooks/
│       ├── lib/
│       └── styles/
├── backend/                  # FastAPI
│   ├── app/
│   ├── alembic/
│   └── tests/
├── ai/                       # Nghiên cứu, huấn luyện và suy luận
├── designs/
│   └── stitch/               # File thiết kế xuất từ Google Stitch
├── docs/                     # Đặc tả, kiến trúc, API, kiểm thử
├── infra/                    # Cấu hình hạ tầng
├── .env.example              # Mẫu biến môi trường (không có bí mật)
├── .gitignore
├── docker-compose.yml
├── rules.md                  # Quy tắc dành cho AI coding
└── README.md
```

> Đây là **cấu trúc đề xuất**, không phải danh sách thư mục đã được xác nhận tồn tại trong repository.

## 7. Quy trình đưa thiết kế Google Stitch vào dự án

1. Hoàn thiện các màn hình **desktop** trên Google Stitch, thống nhất màu sắc, font, thanh menu ngang và component.
2. Xuất thiết kế/mã nguồn/tài nguyên theo các tùy chọn Stitch thực tế cung cấp.
3. Lưu bản xuất vào `designs/stitch/`; **không ghi đè** trực tiếp `frontend/src/`.
4. Đối chiếu bản thiết kế với cấu trúc React hiện tại.
5. Chuyển HTML/CSS thành component React + TypeScript + Tailwind CSS có thể tái sử dụng.
6. Kết nối các trang bằng React Router.
7. Kết nối các trang với API FastAPI khi backend tương ứng hoàn thiện.
8. Kiểm tra giao diện desktop, responsive, tiếng Việt, khả năng truy cập và build.

**Thứ tự dựng UI khuyến nghị:** Design system → Layout chung → Trang chủ → Khóa học → Trang học video → Từ điển → Dashboard → Luyện tập → Admin → AI/video call.

## 8. Thiết lập môi trường phát triển

Backend và migration cơ sở dữ liệu ban đầu: xem [hướng dẫn backend](backend/README.md). Các trang khóa học, bài học của khóa học và từ điển sử dụng API công khai.

### Chạy bằng Docker Compose

Cài và khởi động Docker Desktop, sau đó mở PowerShell tại thư mục gốc dự án. Nếu chưa có tệp `.env`, tạo từ mẫu:

```powershell
Copy-Item .env.example .env
```

Mở tệp `.env` và đặt `MYSQL_PASSWORD` và `MYSQL_ROOT_PASSWORD` bằng hai mật khẩu riêng. Không ghi đè tệp `.env` đang dùng cho database đã khởi tạo. Sau đó chạy:

```powershell
docker compose up --build -d
docker compose ps
```

Truy cập giao diện tại `http://localhost:8080` và tài liệu API tại `http://localhost:8000/docs`. Có thể kiểm tra kết nối database tại `http://localhost:8000/health/ready`. Compose đợi MySQL sẵn sàng và chạy Alembic trước khi khởi động backend. Cơ sở dữ liệu ban đầu trống; khóa học và từ điển sẽ hiển thị nội dung đã xuất bản khi được thêm vào database.

### Xem database bằng giao diện

Truy cập phpMyAdmin tại `http://localhost:8081` sau khi chạy Docker Compose và đăng nhập với:

- Tên người dùng: `vsl_connect`
- Mật khẩu: giá trị `MYSQL_PASSWORD` trong tệp `.env` ở thư mục gốc

Chọn cơ sở dữ liệu `vsl_connect` ở bên trái, rồi chọn tên bảng và **Browse/Duyệt** để xem dữ liệu. phpMyAdmin chỉ được mở trên máy cục bộ và có quyền thay đổi dữ liệu; cẩn thận khi chỉnh sửa hoặc xóa.

Để xem log hoặc dừng ứng dụng:

```powershell
docker compose logs -f
docker compose down
```

Dữ liệu MySQL nằm trong Docker volume và được giữ khi dùng `docker compose down`. Thay mật khẩu trong `.env` sau khi database đã khởi tạo **không** tự đổi mật khẩu trong MySQL; cần đổi mật khẩu trong database tương ứng. Volume PostgreSQL cũ được giữ riêng, không được tự động nhập vào MySQL. Sao lưu trước khi thao tác với volume; `docker compose down -v` sẽ xóa volume MySQL và dữ liệu. Cấu hình này dành cho phát triển cục bộ, chưa thiết lập HTTPS, sao lưu hay triển khai production.

### Yêu cầu dự kiến
- Git
- Node.js LTS và npm
- Python phiên bản tương thích với backend khi được khởi tạo
- MySQL hoặc Docker Desktop

### Clone repository

```bash
git clone <URL_REPOSITORY_CUA_BAN>
cd vsl-connect
```

### Frontend (sau khi đã khởi tạo Vite)

```bash
cd frontend
npm install
npm run dev
```

### Backend không dùng Docker

Xem các bước cài dependency, cấu hình database và chạy FastAPI trong [hướng dẫn backend](backend/README.md).

### Biến môi trường

Tạo `.env` dựa trên `.env.example` khi file mẫu đã được định nghĩa. Không commit `.env`, token, mật khẩu, khóa JWT hoặc thông tin bí mật. **`rules.md` và `README.md` không nằm trong `.env`.**

## 9. Kiến trúc tổng quan

```text
Trình duyệt (React + TypeScript)
          |
          | HTTPS / REST API
          v
      FastAPI Backend --------> MySQL
          |
          +-------------------> Lưu trữ video / media

Giai đoạn V2: Camera -> MediaPipe -> Model AI -> Kết quả luyện tập
Giai đoạn V3: WebRTC video/audio + WebSocket signaling + phụ đề AI
```

Tùy kết quả thử nghiệm, AI inference có thể chạy trong trình duyệt hoặc qua dịch vụ backend riêng. Không đưa video call media stream qua REST API FastAPI.

## 10. Dữ liệu và an toàn

- Nội dung ký hiệu cần có nguồn và quy trình kiểm duyệt phù hợp.
- Không mặc định một từ tiếng Việt tương ứng duy nhất với một ký hiệu VSL.
- Không hiển thị dự đoán AI giả dưới dạng kết quả thật.
- Camera/microphone chỉ hoạt động sau khi người dùng cấp quyền.
- Không tự động lưu video thực hành hay nội dung cuộc gọi.
- Phân quyền và xác thực phải được kiểm tra ở backend.
- Sử dụng HTTPS, hash mật khẩu an toàn, kiểm soát phiên, sao lưu và audit log theo nhu cầu.

## 11. Lộ trình phát triển

- **Giai đoạn 1:** Khởi tạo dự án, design system, giao diện chung, tài khoản và phân quyền.
- **Giai đoạn 2:** Khóa học, bài học, video, từ điển, Admin quản lý nội dung.
- **Giai đoạn 3:** Flashcard, trắc nghiệm, ôn tập ngắt quãng, tiến độ và huy hiệu.
- **Giai đoạn 4:** Kiểm thử, bảo mật, accessibility, triển khai website lên VPS.
- **Giai đoạn 5:** Chuẩn bị dữ liệu VSL, huấn luyện/đánh giá model, tích hợp camera AI.
- **Giai đoạn 6:** WebRTC, signaling, TURN, phụ đề AI và kiểm thử kết nối thực tế.

## 12. Quy tắc đóng góp và làm việc với AI

Trước khi sửa mã nguồn:

1. Đọc `rules.md` và các tài liệu liên quan trong `docs/`.
2. Kiểm tra cấu trúc và chức năng hiện có.
3. Nêu kế hoạch thay đổi và phạm vi ảnh hưởng.
4. Triển khai theo từng module, tái sử dụng component.
5. Chạy kiểm thử/build khả dụng và báo cáo kết quả thực tế.
6. Không tự ý đổi stack, xóa tính năng, tạo dữ liệu VSL không kiểm chứng hoặc công bố AI đã hoạt động khi chưa có model.

## 13. Giấy phép và liên hệ

- **Giấy phép:** Chưa xác định. Không mặc định mã nguồn hoặc video VSL được phép tái sử dụng công khai.
- **Đơn vị phát triển / tác giả:** Bổ sung sau.
- **Liên hệ:** Bổ sung sau.

---

*Tài liệu được xây dựng cho kế hoạch phát triển VSL Connect và cần cập nhật theo trạng thái thực tế của repository.*
