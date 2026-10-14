# Kiểm tra thủ công sau `math-ai-4h-03`

1. Mở website tiếng Việt và nhập câu bằng văn bản. Xác nhận solve dùng đúng câu hiện tại; OCR chỉ được gọi khi tải ảnh.
2. Thử đổi tên biến trong cùng một bài, ví dụ `x,y` thành `a,b`; kiểm tra chữ tiếng Việt không bị thay và mọi công thức dùng đúng tên mới.
3. Thử tỉ số hình học bằng `/`, `:` và `∩`. Kiểm tra mọi điểm, thẳng hàng, vị trí ngoài đoạn và lý do đều được nêu trước khi dùng.
4. Kiểm tra câu chia hết hiển thị `b \vdots a`, không dùng `a \mid b`.
5. Với trò chơi, kiểm tra lời giải nêu người thắng, nước đáp sau mọi nước đối thủ, tính hợp lệ của nước đáp và lý do trò chơi kết thúc.
6. Ở độ rộng 320, 390 và 1100 px, kiểm tra tiêu đề, gợi ý, lời giải và lý do đều render LaTeX; không có tràn ngang, chuỗi tiếng Anh hoặc thẻ “Đáp án cuối cùng”.
7. Hai dạng chưa hỗ trợ ở cấu hình đóng băng là tổng chỉ viết bằng `\sum` và câu bất biến đồng xu không có cue Tổ hợp. Chúng phải trả controlled failure đúng hạn, không bịa lời giải.
