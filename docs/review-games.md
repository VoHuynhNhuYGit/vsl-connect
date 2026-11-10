# Trò chơi ôn tập VSL

Trang `/on-tap` có ba hoạt động dùng video ký hiệu đã xuất bản:

- **Khối hộp:** cần 4 nhãn khác nhau có video. Một đáp án đúng nhận 50 điểm và 3 khối. Mỗi ô đặt được nhận 10 điểm, mỗi hàng/cột đầy nhận 100 điểm. Bảng 6 × 6; các hàng và cột hoàn thành được xóa đồng thời. Chọn khối rồi chọn ô góc trên bên trái, dùng chuột, cảm ứng hoặc bàn phím. Lượt kết thúc khi khay không còn khối đặt được hoặc người chơi chọn kết thúc.
- **Ghép thẻ:** cần 2 nhãn khác nhau có video, mỗi lượt tối đa 6 cặp video–từ. Phát video trước khi chọn thẻ video. Ghép sai cộng 3 giây và trừ 15 điểm; mỗi cặp đúng nhận 100 điểm. Điểm không âm.
- **Blast:** cần 4 nhãn khác nhau có video. Mỗi lượt 10 câu, 3 lượt bảo vệ. Trả lời sai hoặc hết giờ mất 1 lượt bảo vệ. Đáp án đúng nhận 100 điểm và thưởng chuỗi liên tiếp (tăng 20, tối đa 100 điểm thưởng). Nhịp thử thách cho 20 giây sau khi video được xem hết lần đầu; nhịp thoải mái không có giới hạn thời gian. Người chơi chủ động chuyển sang câu tiếp theo sau khi nhận phản hồi.

Bộ lọc chủ đề áp dụng trước khi khử nhãn trùng (không phân biệt hoa/thường, chuẩn hóa Unicode NFC). Ký hiệu không có video hoặc nhãn trống không tham gia trò chơi. Danh sách được tải theo trang 100 mục cho đến khi hết nội dung.

Tạm dừng sẽ khóa điều khiển trò chơi, dừng video và thời gian. Chuyển sang tab khác tự tạm dừng. Video lỗi không mở đáp án hoặc kích hoạt thời gian thử thách. Các hiệu ứng ngắn tôn trọng tùy chọn giảm chuyển động.

Điểm, từ cần ôn thêm và thống kê chỉ tồn tại trong phiên của trang ôn tập. Hiện chưa có API lưu kết quả trò chơi vào tài khoản, và không ghi kết quả vào `localStorage` hay bảng tiến độ. Rời trang hoặc tải lại sẽ bắt đầu phiên mới. Không có dữ liệu ký hiệu mẫu được chèn vào database.

## Kiểm tra logic

Với Node.js 22.23 trở lên, tại `frontend`:

```text
npm run test:review
npm run build
```

Kiểm thử logic bao gồm nhãn trùng, đáp án không trùng, đặt khối ngoài biên, ô bị chiếm, xóa hàng/cột giao nhau và phát hiện hết nước đi. Kiểm thử trình duyệt dùng video tổng hợp và từ vựng thử được chặn ở lớp network của trình duyệt riêng; không ghi vào database.

## Tham khảo cơ chế chơi

- [Quizlet Blocks](https://help.quizlet.com/hc/en-ca/articles/37203179032717-Playing-a-game-of-Blocks)
- [Quizlet Match](https://help.quizlet.com/hc/en-us/articles/360031183611-Playing-Match)
- [Quizlet Blast](https://quizlet.com/features/blast-single-player)

Giao diện và cơ chế chấm điểm trong dự án được điều chỉnh cho video VSL.
