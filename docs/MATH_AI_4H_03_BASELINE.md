# Baseline chống overfitting `math-ai-4h-03`

## Dữ liệu

- 48 câu mới: 12 câu cho mỗi specialist.
- Mỗi specialist: 8 development, 2 validation, 2 final.
- Không có câu trùng nguyên văn với `math-ai-4h-02`.
- Mỗi nhóm có thay tham số và biến thể đổi cách diễn đạt, kí hiệu, tên biến hoặc tên người chơi.

## Kết quả trước khi sửa

Baseline development đạt 19/32 câu verified và đúng kết quả bắt buộc, tương đương 59,4%.

| Specialist | Đạt | Tổng |
|---|---:|---:|
| Đại số | 4 | 8 |
| Hình học | 4 | 8 |
| Số học | 5 | 8 |
| Tổ hợp | 6 | 8 |

Cả 32 request trả về lời giải hoặc controlled failure trong 30 giây. Thời gian lớn nhất là 1.078 giây, trung bình 0.973 giây. Sai hỏng chủ yếu do parser khớp cả câu nguyên văn: bản thay số thường đạt nhưng bản đổi kí hiệu hoặc diễn đạt tương đương bị từ chối.

Baseline test của Worker lúc bắt đầu có 1.087/1.089 test đạt. Hai test hỏng liên quan ngân sách retry và chuyển prompt hình học; sau các thay đổi tổng quát và regression, toàn bộ 1.093 test đạt.
