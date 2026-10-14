# Báo cáo cuối — Math Teacher AI bốn chuyên đề

## Kết quả chính

Phiên bắt đầu lúc **11:44:30 ngày 13-10-2026 (Asia/Singapore)**. Bộ đếm goal cuối cùng ghi **1 giờ 24 phút 10 giây** làm việc chủ động, còn **2 giờ 35 phút 50 giây** trong ngân sách bốn giờ. Thời gian chờ tool và khoảng mất liên tục không được tự động tính; ledger được đối chiếu với bộ đếm goal tại các checkpoint. Toàn bộ lịch sử nằm trong `tools/math-ai-4h-02/run-state.json`.

| Pha | Bắt đầu (Asia/Singapore) | Kết thúc |
|---|---|---|
| Audit và baseline | 13-10 11:44:30 | 13-10 11:58:13 |
| Dataset và phân tích lỗi | 13-10 11:58:13 | 13-10 12:06:28 |
| Sửa lỗi tác động cao | 13-10 12:06:28 | 13-10 13:24:14 |
| Kiểm chứng chuyên đề | 13-10 13:24:14 | 13-10 13:42:47 |
| Regression và final held-out | 13-10 13:42:47 | 13-10 13:47:49 |
| Báo cáo và tái lập | 13-10 13:47:49 | 13-10 14:00:27 (checkpoint hoàn tất) |

Các mốc trên là thời gian tường thực tế. Bộ đếm goal là nguồn chuẩn cho tổng thời gian chủ động; ledger không phân bổ giả tạo các khoảng hơn ba phút vào từng pha khi không có heartbeat, rồi chỉ đối chiếu tổng tại checkpoint.

| Tập | Baseline | Sau sửa | Controlled <30s | Độ trễ lớn nhất sau sửa |
|---|---:|---:|---:|---:|
| Development (40) | 24/40 | 40/40 | 40/40 | 5,403 giây |
| Validation (12) | 12/12 | 12/12 | 12/12 | 3,549 giây |
| Final chưa thấy trước (12) | chưa chạy | 12/12 | 12/12 | 1,104 giây |

Chỉ số “đạt” yêu cầu đồng thời ready, mảnh đáp án toán học, schema, tiếng Việt và LaTeX. Final có 3/3 câu đạt ở từng chuyên đề.

Độ trễ trong bảng là toàn bộ HTTP upload mock + confirm + solve + parse response. Audit browser của 36 trang có trung bình 1,138 giây, p95 1,307 giây, max 1,369 giây cho điều hướng, font và render. Cộng bảo thủ max HTTP final với max render cho 2,473 giây; ngay cả cộng max development với max render cũng là 6,771 giây, dưới 30 giây.

## Thay đổi thực tế

### Đại số

Thêm bộ giải được chứng nhận cho nội suy đa thức bậc không quá hai, tổng khoảng cách/giá trị tuyệt đối, hằng đẳng thức Sophie Germain và tổng rút gọn. Mỗi lời giải xác định hệ số/điều kiện dấu bằng hoặc khai triển độc lập, có bước và lý do rõ ràng.

### Hình học

Thêm các lời giải Ceva bằng tỉ số diện tích, Menelaus bằng khoảng cách vuông góc và tam giác đồng dạng, diện tích tam giác qua chân đường cao/Pythagore, và lục giác đều qua sáu tam giác đều. Mỗi parser tiêu thụ toàn câu và từ chối cấu hình bị thêm giả thiết lạ.

### Số học

Thêm chu kỳ số dư với lũy thừa nhanh kiểm tra độc lập, Euclid cho `gcd(a^m-1,a^n-1)`, liệt kê đầy đủ tổng hai bình phương và phân tích số gồm số chẵn chữ số 1 thành bội của 11. Ký hiệu chia hết trong lesson là `b \vdots a`.

### Tổ hợp

Thêm bất biến chẵn lẻ đồng xu và chiến lược ghép cặp quay 180° cho domino. Bộ kiểm tra duyệt không gian trạng thái hoặc mọi domino hợp lệ. Hai họ xếp kề và đếm hình chữ nhật đi qua solver routine hiện có, hoàn tất 10/10 development.

### Chất lượng hiển thị

Bộ dựng lesson tự viết khôi phục các escape LaTeX bị TypeScript làm hỏng trong đúng vùng toán. Regression mới gọi trực tiếp bộ kiểm tra KaTeX và rò ngôn ngữ. Audit trình duyệt chỉ trong trang đạt 36/36 cho cả 12 final lesson ở 320, 390 và 1100 px.

Audit trang chủ, lịch sử và báo lỗi đạt thêm 9/9 ở ba chiều rộng: tài liệu đặt `lang=vi`, tiêu đề trang là “Trợ lý Toán học”, không có nhãn tiếng Anh đã biết và không tràn ngang.

## Đã train gì

Không fine-tune hoặc RL mô hình nào được thực hiện. Không có model trainable, dataset có giấy phép và compute local phù hợp để chứng minh lợi ích trong ngân sách. Cải tiến đến từ mã xác định, parser toàn câu, certificate toán học, kiểm chứng, dataset và regression tests. Gọi đây là “model training” sẽ không đúng.

## Chi phí và provider

Đánh giá dùng OCR mock để tạo scan, văn bản đã xác nhận để giải, inference ngoài tắt và endpoint local không phục vụ. Gemini/SocLaas fallback tắt trong harness. Chi phí API của phiên đánh giá: **0 USD**. Cấu hình production không bị triển khai hoặc kích hoạt dịch vụ trả phí.

## OCR

Không sửa thuật toán OCR vì baseline lỗi tập trung ở solver. Kết quả local có nhãn gần nhất: 20/20 đạt, CER trung bình 1,953%, CER lớn nhất 9,6%, p95 19,601 giây, max 22,547 giây. Các con số này có ngày 01-10-2026 và được báo là bằng chứng lịch sử; không giả vờ là phép đo mới.

## Kiểm thử đã chạy

- Worker: 87 tệp, 1.080/1.080 đạt với `--maxWorkers=2 --testTimeout=30000`.
- Shared typecheck: đạt.
- Worker typecheck: đạt.
- Mobile: 4 tệp, 21/21 đạt; typecheck và lint đạt.
- HTTP development: 40/40; validation: 12/12; final frozen: 12/12.
- Render page-only: 36/36.
- UI tiếng Việt trang chủ/lịch sử/báo lỗi: 9/9.

Lần chạy Worker mặc định có 14 timeout ở 5 giây do chạy nhiều phép vét cạn song song; không có assertion sai. Rerun có kiểm soát đạt toàn bộ.

## Tệp và bằng chứng

- Dataset: `tools/math-ai-4h-02/benchmark-v1.jsonl`.
- Evaluator: `tools/math-ai-4h-02/evaluate.mjs`.
- Freeze: `tools/math-ai-4h-02/freeze-manifest.json`.
- Kết quả: `baseline-*.jsonl`, `postfix3-*.jsonl`, `final-final.jsonl` và các summary cùng thư mục.
- Checkpoint: `tools/math-ai-4h-02/run-state.json`.
- Regression mới: `worker/test/certified*Families.test.ts` và `worker/test/invariantPairingGame.test.ts`.

## Giới hạn và bước tiếp theo

1. Đo lại OCR trên cùng 20 fixture bằng provider local hiện hành khi dịch vụ local sẵn sàng; không gọi provider trả phí.
2. Mở rộng final mới với cách diễn đạt khác mạnh hơn, hình học nhiều bổ đề hơn và trò chơi không có đối xứng trực tiếp.
3. Thêm review chứng minh hai người độc lập cho các câu chuyên khó; fragment proxy không đủ để chứng nhận mọi định lí tổng quát.
4. Theo dõi p95 trên thiết bị thật; độ trễ harness gồm mock upload nhưng chưa đại diện camera/OCR thật.
5. Giữ parser xác định bảo thủ và chỉ mở rộng khi có test phản ví dụ, để tránh gắn certificate đúng cho đề gần giống nhưng khác điều kiện.
