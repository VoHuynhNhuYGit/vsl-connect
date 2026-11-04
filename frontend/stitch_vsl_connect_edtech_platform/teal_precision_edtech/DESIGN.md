# VSL Connect - Application Design System & UI Specification

## 1. Triết lý Thiết kế & Khả năng Tiếp cận (Core Philosophy & Accessibility)
- **Đối tượng người dùng chính:** Người khiếm thính, khiếm ngôn, học viên ngôn ngữ ký hiệu và quản trị viên.
- **Visual-First (Ưu tiên phản hồi thị giác):** Mọi trạng thái hệ thống (tải dữ liệu, thao tác thành công, cảnh báo lỗi, kết nối WebRTC) phải hiển thị rõ ràng bằng tín hiệu hình ảnh trực quan; tuyệt đối không dựa vào âm thanh hoặc chuyển màu quá mờ nhạt.
- **Tiêu chuẩn tương phản (WCAG 2.1 AA):** Mọi văn bản, biểu tượng và đường viền tương tác phải đảm bảo tỷ lệ tương phản tối thiểu 4.5:1 trên nền tối.

---

## 2. Bố cục Khung Ứng dụng Toàn cục (Global App Shell Structure)
- **Cấu trúc Shell cố định:**
  - **Sidebar điều hướng bên trái:** 
    - Chiều rộng khi mở rộng: `260px` (`w-64`).
    - Chiều rộng khi thu gọn: `72px` (`w-18`).
    - Gồm Logo ứng dụng, thanh chuyển đổi trạng thái thu gọn, danh sách mục điều hướng kèm biểu tượng SVG rõ nét và vệt chỉ báo trang đang chọn (Active Pill).
  - **Top Header:** Chiều cao cố định `64px` (`h-16`), dính trên cùng (`sticky top-0 z-30`), viền dưới ngăn cách nhẹ nhàng. Chứa Breadcrumb điều hướng, nút chuông thông báo và Dropdown thông tin tài khoản (`display_name`, badge vai trò).
  - **Vùng Canvas Nội dung Chính (`<main>`):** Chiều rộng tối đa `1440px`, căn giữa màn hình, đệm lề chuẩn `p-6` hoặc `p-8`, thanh cuộn dọc mượt mà (`scrollbar-thin`).
  - **Phân lớp Z-Index:** Nội dung cơ sở (`z-0`), Sidebar & Header (`z-20` đến `z-30`), Modal & Popup Drawer (`z-50`), Toast cảnh báo (`z-60`).

---

## 3. Hệ thống Token Giao diện (Tailwind CSS Tokens)
- **Bảng màu chủ đạo (Color Palette):**
  - **Màu thương hiệu / Nhấn chính (Emerald & Teal):** Tượng trưng cho sự rõ ràng, hỗ trợ và giao tiếp mượt mà.
    - `primary-50`: `#ECFDF5`
    - `primary-500`: `#10B981` (Nút bấm chính, trạng thái kích hoạt)
    - `primary-600`: `#059669` (Trạng thái rê chuột hover)
    - `primary-focus`: `rgba(16, 185, 129, 0.25)` (Vòng sáng focus ring)
  - **Màu nền tối (Dark Surface Base - Slate & Zinc):**
    - `surface-app`: `#090D16` (Nền bao phủ toàn ứng dụng)
    - `surface-card`: `#111827` (Nền thẻ card, panel bảng điều khiển)
    - `surface-elevated`: `#1F2937` (Nền dropdown, modal nổi, popover)
    - `surface-border`: `#1F2937` hoặc `#374151` (Đường viền ngăn cách tinh tế)
    - `text-primary`: `#F9FAFB` (Chữ tiêu đề, nội dung quan trọng)
    - `text-secondary`: `#9CA3AF` (Chữ phụ, mô tả, nhãn meta)
    - `text-muted`: `#6B7280` (Gợi ý, placeholder, caption)
  - **Chỉ báo Vai trò Người dùng (Role Badges):**
    - `learner`: Khung Indigo (`bg-indigo-500/10 text-indigo-400 border border-indigo-500/20`)
    - `admin`: Khung Hổ phách/Vàng cam (`bg-amber-500/10 text-amber-400 border border-amber-500/20`)

- **Kiểu chữ (Typography):**
  - Phông chữ mặc định: `Inter`, `Be Vietnam Pro`, hoặc hệ thống `sans-serif`.
  - Phân cấp kích thước:
    - Page Title (H1): `text-2xl font-bold tracking-tight text-white`
    - Section Title (H2): `text-xl font-semibold text-white`
    - Card Title (H3): `text-base font-medium text-gray-100`
    - Body Text: `text-sm font-normal text-gray-300 leading-relaxed`
    - Caption / Meta: `text-xs text-gray-400`

- **Bo góc & Đường viền (Borders & Radii):**
  - Container / Card chính: `rounded-xl` (`12px`) với đường viền `border border-gray-800`
  - Nút bấm (Button) & Khung nhập liệu (Input): `rounded-lg` (`8px`)
  - Tag / Badge / Pill: `rounded-full` (`px-3 py-1 text-xs`)

---

## 4. Tiêu chuẩn Thành phần Giao diện (Component Standards)
1. **Trạng thái Tương tác (Interactive States):** Mọi nút bấm và liên kết bắt buộc phải có đầy đủ 5 trạng thái: `default`, `hover`, `active` (`active:scale-95`), `focus-visible` (`outline-none ring-2 ring-emerald-500`), và `disabled` (`opacity-50 cursor-not-allowed`).
2. **Khung tải trước (Skeleton Loaders):** Không dùng vòng xoay spinner đơn độc giữa trang. Dùng khung nhấp nháy (`animate-pulse bg-gray-800 rounded-lg`) khớp với tỷ lệ hình học thực tế của thẻ video hoặc hàng dữ liệu.
3. **Màn hình Trống (Empty States):** Khi danh sách từ vựng hoặc khóa học trống, luôn hiển thị biểu tượng minh họa dạng phẳng, thông báo ngắn gọn và 1 nút thao tác (ví dụ: "Tải lại trang" hoặc "Xóa bộ lọc").
4. **Khung xem trước Video & Camera:** Luôn giữ cố định tỷ lệ khung hình `16:9` hoặc `4:3`, nền mặc định màu `bg-gray-900` khi video chưa sẵn sàng, góc trên hoặc dưới có nhãn trạng thái kết nối WebRTC.
5. **Thanh điều khiển Nổi (Floating Bar):** Dành cho màn hình luyện tập cử chỉ và phòng gọi video; các nút thao tác (Mic, Camera, Nhận diện AI, Thoát) gom gọn trong thanh dock nổi bo tròn phía đáy màn hình.

---

## 5. Phân tầng Các Tuyến Đường Chính (Application Routes)
- `/dashboard`: Bảng điều khiển tiến trình học tập, bài học gần nhất và lối tắt luyện tập.
- `/dictionary`: Danh mục từ điển ký hiệu, thanh tìm kiếm từ khóa, bộ lọc chủ đề và lưới video mẫu.
- `/practice`: Màn hình luyện tập chia đôi: Khung video mẫu bên trái, khung camera nhận diện MediaPipe/AI bên phải kèm thanh độ chính xác (Accuracy Bar).
- `/call`: Phòng đàm thoại video WebRTC hỗ trợ phụ đề chuyển ngữ trực tiếp theo thời gian thực.