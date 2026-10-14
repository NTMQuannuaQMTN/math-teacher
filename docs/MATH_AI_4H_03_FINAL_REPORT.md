# Báo cáo cuối `math-ai-4h-03`

## Kết quả

Phiên này cải thiện development từ 19/32 lên 32/32. Validation mới đạt 8/8. Final được chạy đúng một lần sau khi đóng băng và đạt 6/8; hai câu còn lại trả controlled failure, không phát sinh lời giải sai.

| Tập | Verified, đúng toán và đạt chất lượng | Controlled dưới 30 giây | Thời gian lớn nhất |
|---|---:|---:|---:|
| Baseline development | 19/32 | 32/32 | 1.078 s |
| Development sau sửa | 32/32 | 32/32 | 1.126 s |
| Validation | 8/8 | 8/8 | 2.853 s |
| Final đã đóng băng | 6/8 | 8/8 | 1.004 s |

Theo specialist trên final: Đại số 1/2, Hình học 2/2, Số học 2/2, Tổ hợp 1/2. Mười tám lượt render của sáu lời giải final thành công đều đạt ở 320, 390 và 1100 px. Render lớn nhất 1.554 giây; cộng bảo thủ với HTTP lớn nhất cho 2.558 giây, thấp hơn nhiều so với giới hạn 30 giây.

## Thay đổi tổng quát

- Đại số đọc cấu trúc nội suy, tổng khoảng cách, Sophie Germain và tổng rút gọn với tên biến linh hoạt.
- Hình học đọc quan hệ điểm-cạnh, tỉ số `/` hoặc `:`, giao điểm và ba cạnh mà không phụ thuộc nguyên văn câu dẫn.
- Số học đọc cách hỏi số dư, UCLN, phương trình tổng hai bình phương và repunit; tên biến được giữ trong công thức.
- Tổ hợp đọc cách chọn nhóm và bắt tay bằng cách diễn đạt tự nhiên; trò domino giữ đúng tên người chơi, còn invariant kiểm tra mọi trạng thái hoặc mọi nước đáp.
- Router nhận câu đếm cặp nghiệm nguyên là Số học lẫn Tổ hợp để verifier không loại specialist đúng.

Các parser vẫn từ chối dữ kiện thêm hoặc luật chơi đổi khác thay vì tái sử dụng certificate không phù hợp. Không có paid inference, Gemini fallback hay SocLaas fallback trong đánh giá.

## Chứng cứ tái lập

- Corpus: `tools/math-ai-4h-03/benchmark-v1.jsonl`
- Baseline: `tools/math-ai-4h-03/baseline-development-summary.json`
- Development cuối: `tools/math-ai-4h-03/post2-development-summary.json`
- Validation cuối: `tools/math-ai-4h-03/validation3-validation-summary.json`
- Final: `tools/math-ai-4h-03/frozen-final-summary.json`
- Freeze manifest: `tools/math-ai-4h-03/freeze-manifest.json`
- Render audit: `tools/math-ai-4h-03/render/results.json`
- Nhật ký thời gian: `tools/math-ai-4h-03/run-state.json`

Freeze lúc `2026-10-14T01:52:10.123Z`: source/config SHA-256 `31f2764134ccf0d714eb3fb7848c1d7f804c9c74848e1030207cd5955c261a55`; benchmark SHA-256 `ee238a3cbe423638a7733b6d7a43a8cea205f6ea64f5d45a4d46e99b92e4ecb2`.

Regression cuối: Worker 90 file / 1.093 test; shared và Worker typecheck; mobile 4 file / 21 test và typecheck. Tất cả đạt. `git diff --check` không phát hiện lỗi khoảng trắng.
