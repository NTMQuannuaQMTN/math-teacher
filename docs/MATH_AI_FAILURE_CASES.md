# Các lỗi và cách xử lý trong phiên math-ai-4h-02

## Thiếu phủ bài khi inference không khả dụng

Baseline có 16/40 câu development trả controlled failure. Nguyên nhân chung là parser/bộ giải xác định chưa phủ dạng bài và local model không phục vụ. Đã thêm các họ có parser toàn câu, certificate độc lập và lời giải từng bước. Kết quả sau sửa là 40/40 development.

## LaTeX bị hỏng trong chuỗi TypeScript

Lần chạy trung gian đạt 33/40. Các lesson mới đã được tạo nhưng bị lớp an toàn từ chối vì `\frac`, `\begin`, `\vdots` hoặc `\varnothing` trong string literal biến thành ký tự điều khiển hay mất dấu gạch chéo. Hệ thống không hiển thị nội dung hỏng mà trả controlled failure.

Cách sửa: bộ dựng lesson khôi phục có giới hạn các lệnh trong vùng toán tự viết, sau đó mọi test mới gọi chính `latexFeedback` và `cleanLanguage`. Một bản sửa đầu tiên làm hỏng `\\` xuống dòng hợp lệ của lesson cũ; phạm vi được thu hẹp chỉ còn dấu `\` đơn bị hỏng. Regression cuối đạt 1.080/1.080.

## Trò chơi và bất biến

- Đồng xu: theo dõi tính chẵn lẻ số đồng đang ngửa, xét đủ ba kiểu lật hai đồng; BFS độc lập xác nhận trạng thái đích không đạt được.
- Domino `2×n` với `n` chẵn: Bình đáp bằng ảnh quay 180°. Lời giải chứng minh riêng tính kề, hai domino không trùng, nước đáp còn trống dưới bất biến đối xứng và trò chơi kết thúc. Bộ kiểm tra duyệt mọi domino hợp lệ cho các kích thước biên.

Điều này thay cho các lập luận sai kiểu “chọn đủ nhiều lần nên chắc chắn phủ hết”, vốn không kiểm soát vị trí thay đổi của đối thủ.

## Hình học

Các họ Ceva, Menelaus, diện tích 13–14–15 và lục giác đều từng không có câu trả lời khi inference tắt. Bản sửa nêu quan hệ diện tích/đường cao, vị trí giao điểm ngoài, hai phương trình Pythagore và sáu tam giác đều. Không quan hệ đồng viên, góc bằng nhau hoặc vị trí điểm nào được suy từ hình vẽ.

## Lỗi/giới hạn còn lại

- OCR không được đo lại bằng provider thật trong phiên; số liệu OCR trong báo cáo là kết quả local có nhãn gần nhất.
- Mathematical proxy dùng các mảnh kết quả và bộ kiểm tra cấu trúc; với chứng minh tổng quát, review/certificate vẫn cần thiết.
- Một bước final về phương trình phân thức liệt kê hai nghiệm bị loại bằng câu văn hơi gọn; điều kiện xác định ở bước đầu và kết luận vô nghiệm vẫn đúng. Không chỉnh theo final đã mở để giữ tính trung thực của held-out.
- Các parser xác định cố ý từ chối đề có điều kiện phụ hoặc cấu trúc khác, sau đó chuyển sang pipeline chung; đây là bảo vệ chống dùng nhầm certificate.
- Lần chạy Worker mặc định song song có 1.061 pass và 14 timeout 5 giây do tranh chấp tài nguyên. Cùng suite với hai worker và timeout 30 giây đạt toàn bộ; sau khi thêm 5 property tests, kết quả cuối là 1.080/1.080, không có assertion toán học thất bại.
