# Phiên đánh giá chống overfitting `math-ai-4h-03`

## Mục tiêu và dữ liệu

Phiên này dùng 48 câu mới, cân bằng bốn specialist. Mỗi specialist có 8 câu development, 2 câu validation và 2 câu final. Không câu nào lấy từ final của `math-ai-4h-02`. Các cặp kiểm tra thay hệ số, đổi tên biến hoặc người chơi, đảo thứ tự dữ kiện, đổi kí hiệu tương đương và diễn đạt tự nhiên.

Development được dùng để tìm lỗi. Validation chỉ được mở sau khi development đạt yêu cầu. Cấu hình, mã nguồn, evaluator và toàn bộ benchmark được băm trong `tools/math-ai-4h-03/freeze-manifest.json` trước lần chạy final đầu tiên.

## Đường chạy ứng dụng

Mỗi câu đi qua đúng chuỗi HTTP của ứng dụng: tải ảnh mẫu để tạo scan, xác nhận văn bản câu hỏi, rồi gọi solve với `regenerate=true`. OCR chỉ chạy ở bước tải ảnh; lời giải dùng duy nhất văn bản đã xác nhận. Server riêng chạy cổng 8799 với kho D1 riêng, OCR mock, local inference trỏ đến cổng không tồn tại, Gemini fallback tắt, SocLaas fallback tắt và không có khóa trả phí.

## Điều kiện đạt

Một câu đạt khi lời giải ở trạng thái `ready`, verification là `verified`, chứa các kết quả toán bắt buộc, hợp schema, không có lỗi LaTeX hoặc rò rỉ ngôn ngữ và hoàn tất trong 30 giây. Controlled failure đúng hạn được ghi riêng nhưng không tính là câu toán đạt. Reference answer không được gửi vào request.

## Kiểm tra độc lập

Các family dùng certificate tách khỏi phần trình bày: nội suy bằng hệ số, cực trị bằng trung vị, đồng nhất thức bằng khai triển; Ceva/Menelaus bằng tích tỉ số, diện tích bằng Pythagore; lũy thừa môđun, Euclid trên số mũ, vét cạn tổng hai bình phương; đếm bằng DP/liệt kê, bất biến bằng duyệt trạng thái, và chiến lược domino bằng kiểm tra mọi domino cùng ảnh quay.
