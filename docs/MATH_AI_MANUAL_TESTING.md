# Kiểm thử thủ công Math Teacher AI

## Chuẩn bị

```bash
cd /Users/qnrj/Code/math-teacher
node tools/math-ai-4h-02/server.mjs
```

Chạy ứng dụng web hiện có ở `http://localhost:8081`. Harness Worker cô lập ở `http://localhost:8798`, không có credentials trả phí.

## Kiểm tra upload và OCR

1. Mở trang upload và chọn một ảnh đề.
2. Xác nhận OCR chỉ chạy lúc upload.
3. Sửa văn bản nếu cần và bấm xác nhận.
4. Mở lời giải; kiểm tra request solve dùng đúng văn bản đã xác nhận, không OCR lại ảnh.
5. Với ảnh mờ hoặc biểu thức mơ hồ, kiểm tra ứng dụng yêu cầu sửa hoặc trả trạng thái kiểm soát thay vì đoán.

## Kiểm tra lời giải

Với mỗi chuyên đề, dùng ít nhất một câu development và một câu khác hằng số:

- Đại số: giữ điều kiện xác định, giải từng bước, thế kiểm tra nghiệm ngoại lai.
- Hình học: từng quan hệ phải có giả thiết/định lí; không dựa vào hình vẽ.
- Số học: hiển thị `b \vdots a` cho “b chia hết cho a”, xét cả dấu và miền nguyên.
- Tổ hợp: các trường hợp phải đủ và không trùng; trò chơi phải cho quy tắc đáp với mọi nước đối thủ.

Kiểm tra thêm:

- Toàn bộ nhãn và nội dung hiển thị bằng tiếng Việt có dấu.
- Tiêu đề gợi ý, giải thích và lý do render được LaTeX.
- Mỗi ý `a)`, `b)`, `c)` nằm trên dòng riêng.
- Không thấy raw `\frac`, `\begin`, ký tự điều khiển hoặc `.katex-error`.
- Kết luận nằm tự nhiên ở bước cuối; không có thẻ “Đáp án cuối cùng” riêng.
- Partial/lỗi có cấu trúc xuất hiện trước 30 giây nếu không thể giải.

## Kiểm tra responsive chỉ trong tab

```bash
cd tools/e2e
node math-ai-4h-02-render.mjs
```

Script dùng Chromium headless, chỉ chụp nội dung trang, chặn mọi `/v1/**`, và kiểm tra cả 12 solution final ở chiều rộng 320, 390 và 1100. Kết quả nằm tại `tools/math-ai-4h-02/render/results.json`; ảnh PNG cùng thư mục. Phiên này đạt 36/36, không lỗi KaTeX, raw fallback, tiếng Anh UI, tràn ngang hoặc thẻ đáp án cuối riêng.

`node vietnamese-ui-audit.mjs` kiểm tra thêm trang chủ, lịch sử và báo lỗi ở cùng ba chiều rộng. Kết quả `tools/math-ai-4h-02/ui/results.json` đạt 9/9: `lang=vi`, tiêu đề “Trợ lý Toán học”, không nhãn tiếng Anh đã biết và không tràn ngang.

## Kiểm thử tự động

```bash
cd shared && npm run typecheck
cd ../worker && npm run typecheck
npm test -- --run --maxWorkers=2 --testTimeout=30000
cd ../mobile && npm test -- --run && npm run typecheck && npm run lint
```
