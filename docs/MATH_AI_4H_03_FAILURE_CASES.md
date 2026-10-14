# Failure cases `math-ai-4h-03`

## Các lỗi đã sửa bằng development và validation

1. Parser từng phụ thuộc câu dẫn cố định. Các parser mới đọc dữ kiện toán: ba giá trị đa thức, ba hạng giá trị tuyệt đối, hai tỉ số hình học, ba cạnh, cơ số-số mũ-môđun, hoặc luật đếm/trò chơi.
2. Đổi tên biến từng làm thay nhầm chữ trong tiếng Việt, ví dụ chữ cuối của “Vậy”. Việc đổi tên nay chỉ chạy trong trường `math` và các đoạn được bao bởi dấu LaTeX.
3. Diện tích lục giác đúng nhưng chưa rút gọn, ví dụ `192\sqrt3/2`. Bước cuối nay rút gọn thành `96\sqrt3` khi hệ số chẵn.
4. Câu “bao nhiêu cặp `(u,v)` nguyên” bị xếp vào Tổ hợp mà thiếu Số học, làm verifier từ chối một lời giải Số học đúng. Router nay nhận diện miền số nguyên của cặp biến.
5. Kí hiệu tỉ số `AD:DB`, giao điểm viết bằng `∩`, tên đa thức/biến khác, `UCLN` thay cho `\gcd`, và các từ đồng nghĩa thông dụng được chấp nhận khi toàn bộ quan hệ bắt buộc vẫn có mặt.

## Hai lỗi còn lại trong final đã đóng băng

- `a4-final-telescope-sigma`: parser đã học tổng khai triển nhưng chưa nhận chỉ riêng kí hiệu `\sum`; request trả controlled failure sau 0.961 giây.
- `c4-final-coins`: certificate chẵn lẻ có thể đọc luật, nhưng câu không có cue Tổ hợp quen thuộc nên kiểm tra topic từ chối đường giải; request trả controlled failure sau 1.004 giây.

Hai câu này không được dùng để sửa source sau khi xem final. Chúng là giới hạn trung thực của cấu hình đóng băng và là dữ liệu development cho một phiên sau với final mới.
