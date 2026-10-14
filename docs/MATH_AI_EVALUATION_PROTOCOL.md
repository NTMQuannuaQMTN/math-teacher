# Giao thức đánh giá Math Teacher AI

## Bộ câu hỏi

`tools/math-ai-4h-02/benchmark-v1.jsonl` có 64 câu, cân bằng 16 câu cho mỗi chuyên đề:

| Split | Đại số | Hình học | Số học | Tổ hợp | Tổng |
|---|---:|---:|---:|---:|---:|
| Development | 10 | 10 | 10 | 10 | 40 |
| Validation | 3 | 3 | 3 | 3 | 12 |
| Final | 3 | 3 | 3 | 3 | 12 |

Mỗi dòng ghi ID, chủ đề, độ khó, dạng bài, đề gốc, đề chuẩn hóa, đáp án/tham chiếu đã kiểm chứng, phương pháp cho phép, chế độ đầu vào, tiêu chí và nguồn. Các câu synthetic được kiểm tra bằng suy luận độc lập, số học chính xác, tọa độ hoặc vét cạn hữu hạn khi phù hợp.

Các câu final không được chạy trước thời điểm đóng băng. Development được dùng để tìm và sửa lỗi; validation được chạy lại trước khi đóng băng. Không chỉnh mã hoặc cấu hình theo kết quả final.

## Cách chạy

Mỗi câu đi qua toàn bộ HTTP:

1. Tải fixture ảnh lên để tạo scan. OCR ở chế độ `mock`, vì phép đo này đánh giá solver.
2. Xác nhận `normalizedStatement` qua endpoint confirm.
3. Gọi endpoint solve với giới hạn cứng 30 giây.
4. Đọc chính response ứng dụng trả về.
5. Kiểm tra status, các mảnh kết quả bắt buộc, schema, tiếng Việt, LaTeX và thời gian từ đầu upload đến hết solve.

Đáp án tham chiếu chỉ được dùng sau response để chấm; evaluator không gửi nó vào scan, confirm hoặc solve. `response` đầy đủ được lưu trong JSONL để xem lại từng bước.

## Chỉ số

- **Ready:** API trả `solution.status = ready`.
- **Mathematical proxy pass:** ready, chứa mọi mảnh kết quả bắt buộc, schema hợp lệ, không lỗi LaTeX và không rò ngôn ngữ đã biết.
- **Quality pass:** schema, LaTeX và ngôn ngữ đều đạt.
- **Controlled within 30s:** trong 30 giây trả lời giải hoàn chỉnh, partial trung thực hoặc lỗi có cấu trúc.
- **HTTP latency:** upload + confirm + solve + parse response; không tính thời gian chấm sau response.
- **Render latency:** điều hướng trang lesson đã lưu + tải font + hai frame render. Audit trình duyệt đo riêng vì HTTP evaluator không chạy UI.

Proxy không thay thế đánh giá chứng minh. Các lời giải mới còn có certificate riêng: thế nghiệm, tính chính xác, tọa độ, Euclid, vét cạn trạng thái hoặc kiểm tra mọi nước hợp lệ. Mọi câu final đã được đọc lại thủ công sau phép chấm tự động.

Audit 36 lượt render có trung bình 1,138 giây, p95 1,307 giây và lớn nhất 1,369 giây. Cộng bảo thủ hai cực đại khác mẫu của final cho cận trên quan sát được 2,473 giây từ upload mock đến trang đã render, thấp hơn giới hạn 30 giây.

## Cấu hình cô lập

- OCR: `mock` trong đánh giá solver.
- External inference: tắt; endpoint local trỏ tới cổng không phục vụ.
- Gemini và SocLaas fallback: tắt trong harness.
- Chi phí API: 0 USD.
- Freeze: `tools/math-ai-4h-02/freeze-manifest.json`.
- Hash mã nguồn và cấu hình: `f08e5c4b3b424d7b4b20427fb8fce62807ee94f1b8c9dc25ccbd51d505552c9d`.
- Hash benchmark: `1c27fabec7d49120093fcb9d3977331f8133287cb5fb96cf92780b1dc82cd09c`.

## Lệnh tái lập

```bash
python3 tools/math-ai-4h-02/build_benchmark.py
node tools/math-ai-4h-02/server.mjs
node tools/math-ai-4h-02/evaluate.mjs rerun development
node tools/math-ai-4h-02/evaluate.mjs rerun validation
node tools/math-ai-4h-02/evaluate.mjs rerun final
```

Không chạy lại final để điều chỉnh hệ thống. Nếu mã thay đổi, tạo phiên bản benchmark/freeze mới và xem final cũ là development đã lộ.
