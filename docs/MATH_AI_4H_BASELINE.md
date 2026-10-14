# Math Teacher AI — baseline bốn chuyên đề

## Phạm vi và thời điểm

Phiên `math-ai-4h-02` bắt đầu lúc **11:44:30 ngày 13-10-2026 (Asia/Singapore)**. Baseline được chốt trước các sửa đổi của phiên này. Mọi phép đo HTTP dùng Worker cô lập tại `127.0.0.1:8798`, OCR giả lập để tạo bản quét, suy luận bên ngoài bị tắt và văn bản đề đã xác nhận được gửi vào bước giải. Không API trả phí nào được gọi.

## Luồng thực tế đã kiểm tra

1. Ứng dụng tải ảnh lên `POST /v1/scans`.
2. OCR, chuẩn hóa và tách câu tạo văn bản có thể sửa.
3. `POST /confirm` lưu đúng văn bản người dùng xác nhận.
4. `POST /solve` chỉ đọc văn bản đã xác nhận, định tuyến qua bộ giải xác định/chuyên đề, bộ lập kế hoạch hình học hoặc mô hình đã cấu hình.
5. Lời giải qua schema, kiểm tra ngôn ngữ, LaTeX, phụ thuộc chứng minh và các bộ kiểm chứng toán học.
6. Ứng dụng hiển thị tiêu đề, gợi ý, từng bước, lý do và công thức bằng KaTeX.

Các tệp chính đã kiểm tra gồm `worker/src/routes/scans.ts`, `worker/src/routes/solve.ts`, `worker/src/ocr`, `worker/src/solver`, `shared/src/verify.ts`, `shared/src/language.ts`, `shared/src/mathText.ts` và các thành phần bài giải trong `mobile/src/components/lesson`.

## Trạng thái kiểm thử ban đầu

- Shared typecheck: đạt.
- Worker typecheck: đạt.
- Worker: 80 tệp, 1.031 kiểm thử đạt.
- Mobile: 4 tệp, 21 kiểm thử đạt; typecheck và lint đạt.

## Baseline HTTP

| Tập | Sẵn sàng và đạt proxy toán/chất lượng | Controlled dưới 30 giây | Độ trễ lớn nhất |
|---|---:|---:|---:|
| Development | 24/40 | 40/40 | 1,045 giây |
| Validation | 12/12 | 12/12 | 1,008 giây |

Mỗi chuyên đề development đạt đúng 6/10. Mười sáu câu còn lại trả controlled failure vì không có tài nguyên suy luận ngoài; không câu nào trả lời bịa đặt:

- Đại số: nội suy bậc hai, trung vị tổng giá trị tuyệt đối, Sophie Germain, tổng rút gọn.
- Hình học: Ceva, Menelaus, diện tích tam giác không dùng Heron, lục giác đều.
- Số học: chu kỳ lũy thừa, ƯCLN của hiệu lũy thừa, tổng hai bình phương, số gồm các chữ số 1.
- Tổ hợp: xếp hàng có điều kiện kề nhau, đếm hình chữ nhật, bất biến đồng xu, trò chơi domino.

## OCR trước phiên

Kết quả có nhãn gần nhất là `tools/ocr-eval/results/2026-10-01T00-20-43-828Z-local.json`: 20/20 tình huống đạt tiêu chí, CER trung bình 1,953% trên 18 mẫu có văn bản, CER lớn nhất 9,6%, p95 19,601 giây và lớn nhất 22,547 giây. Đây là bằng chứng lịch sử của bộ OCR local, không phải phép đo lại trong phiên này. Phiên hiện tại không gọi dịch vụ OCR thật vì không có lý do để phát sinh chi phí; các kiểm thử tích hợp OCR vẫn nằm trong bộ hồi quy Worker.

## Rủi ro ưu tiên

1. Thiếu lời giải khi suy luận local không khả dụng.
2. Chuỗi LaTeX do TypeScript tự viết có thể bị mất dấu `\` trước khi đến KaTeX.
3. Trò chơi cần chiến lược đáp cho mọi nước, không thể suy từ đếm lặp hay một ví dụ.
4. Hình học cần chứng minh quan hệ được dùng; hình vẽ không thay thế giả thiết.
5. Các lời giải phải giữ điều kiện xác định, xét đủ trường hợp và đặt kết luận trong bước cuối.

Baseline máy đọc được: `tools/math-ai-4h-02/baseline-development.jsonl` và `baseline-validation.jsonl`.
