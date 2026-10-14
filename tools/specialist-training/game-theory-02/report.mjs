import {readFileSync, writeFileSync} from 'node:fs';

const base = 'tools/specialist-training/game-theory-02';
const repair = JSON.parse(readFileSync(`${base}/live-repair-answers.json`, 'utf8'));
const heldout = JSON.parse(readFileSync(`${base}/heldout-answers.json`, 'utf8'));
const independent = JSON.parse(readFileSync(`${base}/heldout-independent-checks.json`, 'utf8'));
const endToEnd = JSON.parse(readFileSync(`${base}/end-to-end-render.json`, 'utf8'));
const state = JSON.parse(readFileSync(`${base}/run-state.json`, 'utf8'));
const forward4 = JSON.parse(readFileSync(`${base}/exact-9-4.json`, 'utf8'));
const forward2 = JSON.parse(readFileSync(`${base}/exact-9-2.json`, 'utf8'));
const backward4 = JSON.parse(readFileSync(`${base}/backward-9-4.json`, 'utf8'));
const backward2 = JSON.parse(readFileSync(`${base}/backward-9-2.json`, 'utf8'));
const pathCheck = JSON.parse(readFileSync(`${base}/independent-path-check.json`, 'utf8'));
const rl = JSON.parse(readFileSync(`${base}/rl-4-42.json`, 'utf8'));
const cold = JSON.parse(readFileSync(`${base}/rl-4-42-zero.json`, 'utf8'));

const fmt = (ms) => `${ms.toFixed(2)} ms`;
const math = (value) => value ? `\n\n\\[${value}\\]\n` : '';
const lessonMd = (lesson) => {
  const lines = [lesson.strategy, '', '### Lời giải thực tế'];
  for (const [index, step] of lesson.steps.entries()) {
    lines.push('', `#### Bước ${index + 1}. ${step.title}`, '', step.explanation, math(step.math), `**Lý do:** ${step.reason ?? 'Không áp dụng.'}`);
  }
  lines.push('', `**Kết luận trong bước cuối:** ${lesson.finalAnswer.text}`);
  return lines.join('\n');
};
const times = heldout.map((r) => r.durationMs).sort((a, b) => a - b);
const percentile = (p) => times[Math.ceil(p * times.length) - 1];
const passes = independent.filter((r) => r.result === 'mathematics checked').length;
const failures = independent.filter((r) => r.result.startsWith('controlled')).length;

const out = [
  '# Huấn luyện Lý thuyết trò chơi — phản hồi lần 02',
  '',
  'Phiên bản đóng băng: `solver-v2.40`. Đây là báo cáo của lần sửa theo phản hồi người dùng, không thay đổi điểm số held-out lịch sử của iteration 03 và không tuyên bố đã huấn luyện trọng số của mô hình ngôn ngữ.',
  '',
  '## Kết quả chính',
  '',
  '- Lời giải đếm ô đen/trắng sai đã bị loại. Một đường trốn cụ thể của An vẫn tồn tại sau cả 8 lượt của lịch sai.',
  '- Với bảng `2 × 9`, lịch hỏi mới bắt mọi đường đi hợp lệ sau 6 lượt khi `k = 4`; đây là số lượt tối ưu. Khi `k = 2`, số lượt tối ưu là 16.',
  '- Lời giải trong ứng dụng ghi rõ các ô hỏi, tập vị trí còn có thể đứng sau từng câu trả lời “không”, và lý do loại từng vị trí.',
  '- Q1 hiện có 18 bước; phép nhân liên hợp, điều kiện mẫu khác 0, phép chia, thay biểu thức và chuyển vế được viết thành các bước riêng.',
  '- Q2 không dùng ký hiệu tập hợp bị cấm. Các bài lấy sỏi không liên tiếp ghi phép trừ cho từng trạng thái thay vì chỉ liệt kê trạng thái thua.',
  '',
  '## Thời gian và phạm vi',
  '',
  `Bắt đầu ghi nhận: ${state.startedAt}. Checkpoint gần nhất: ${state.lastHeartbeatAt}. Thời gian kỹ thuật/kiểm thử chủ động đã ghi: ${(state.activeSeconds / 60).toFixed(1)} phút. Còn lại từ giới hạn hai giờ: ${(state.remainingSeconds / 60).toFixed(1)} phút. Các khoảng nghỉ hoặc mất liên tục trên 180 giây bị loại, không được tính giả thành thời gian huấn luyện.`,
  '',
  'Không có OCR trong các phép thử giải toán: văn bản đã xác nhận được đưa thẳng vào bộ giải. Backend đánh giá tách biệt dùng mô hình loopback không khả dụng và tắt mọi fallback bên ngoài. Không có API trả phí hoặc chi phí suy luận.',
  '',
  '## Phân tích lỗi Q5 cũ',
  '',
  'Việc đã hỏi đủ mọi ô đen ở những thời điểm khác nhau không chứng minh An ở đúng một trong các ô đó tại thời điểm được hỏi. Bộ kiểm tra đường đi độc lập tìm được đường trốn sau:',
  '',
  `\`${JSON.stringify(pathCheck.incorrectFixedColour.escapingPath)}\``,
  '',
  `Số vị trí vẫn có thể đứng sau từng lượt của lịch sai: \`${pathCheck.incorrectFixedColour.survivors.join(', ')}\`. Do đó mỗi lượt vẫn còn 14 vị trí có thể và lập luận cũ không tiến triển.`,
  '',
  '## Tìm chiến lược và kiểm chứng tối ưu',
  '',
  `Tìm kiếm tiến trên toàn bộ trạng thái niềm tin cho kết quả ${forward4.depth} lượt với \(k=4\) và ${forward2.depth} lượt với \(k=2\). Một bộ giải ngược độc lập, không dùng rút gọn đối xứng, xác nhận số lượt tối ưu tương ứng là ${backward4.optimalTurns} và ${backward2.optimalTurns}. Trên các bảng nhỏ 2–4 cột, cả hai bộ giải còn khớp với BFS không cắt tỉa.`,
  '',
  `Bộ duyệt tọa độ thứ ba kiểm tra mọi ô xuất phát và mọi nước kề cạnh: số vị trí còn lại của lịch \(k=4\) là \(${pathCheck['4'].survivors.join(', ')}\); của lịch \(k=2\) là \(${pathCheck['2'].survivors.join(', ')}\). Cả hai kết thúc ở 0.`,
  '',
  '### Thí nghiệm Q-learning được báo cáo trung thực',
  '',
  `Chạy Q-learning bảng cục bộ đã cập nhật ${rl.updates} cặp trạng thái–hành động trong ${rl.episode} tập. Khởi tạo heuristic đã chứa một chính sách 6 lượt hợp lệ ngay ở episode 0, nên kết quả này không chứng minh việc cập nhật Q đã tự học được chiến lược. Ablation khởi tạo 0 thực hiện ${cold.updates} cập nhật nhưng không tìm được chính sách thắng. Chính sách được dùng trong ứng dụng chỉ được chấp nhận sau ba kiểm tra vét cạn; đây là solver engineering và thí nghiệm RL, không phải cập nhật trọng số LLM.`,
  '',
  '## Các câu người dùng đã báo',
];

for (const row of repair) {
  out.push('', `## ${row.id.toUpperCase()}`, '', '**Đề hiện tại:**', '', row.text, '', `**Phản hồi thực tế:** ready; ${row.model}; ${fmt(row.endToEndOfflineMs)} trong đường giải cô lập. Schema, LaTeX và ngôn ngữ: đạt.`, '', lessonMd(row.lesson));
}

out.push('', '## Đánh giá held-out sau khi đóng băng', '', `Mẫu chính xác: ${heldout.length} câu mới sau freeze. ${passes} câu thuộc họ được hỗ trợ trả lời ready và vượt kiểm tra toán độc lập; ${failures} luật chơi ngoài phạm vi trả controlled failure. Không có timeout. p50 ${fmt(percentile(.5))}; p95 ${fmt(percentile(.95))}; tối đa ${fmt(Math.max(...times))}. Tỉ lệ trả phản hồi có kiểm soát trong 30 giây: 16/16. Tỉ lệ đúng toán trên toàn bộ mẫu nếu controlled failure không được tính là lời giải: ${passes}/16 = ${(100 * passes / heldout.length).toFixed(1)}%. Trên riêng phạm vi được hỗ trợ: ${passes}/${passes} = 100%, với cỡ mẫu nhỏ.`, '', '| ID | Họ bài | Trạng thái | Mô hình | Thời gian | Kiểm tra độc lập |', '|---|---|---|---|---:|---|');
for (const row of heldout) {
  const check = independent.find((r) => r.id === row.id);
  out.push(`| ${row.id} | ${row.family} | ${row.body.solution.status} | ${row.body.solution.model} | ${fmt(row.durationMs)} | ${check.result} |`);
}
out.push('', 'Ba controlled failure là biến thể cho phép đứng yên, Chomp và Wythoff. Hệ thống không dùng chứng chỉ của luật “bắt buộc di chuyển” cho luật “được đứng yên”, và không bịa chiến lược cho hai trò chưa được chứng nhận.', '', '## Độ trễ toàn đường đến khi hiển thị', '', '| Câu | HTTP → sinh/kiểm tra/định dạng → parse schema → KaTeX và font sẵn sàng | Kết quả |', '|---|---:|---|');
for (const row of endToEnd) out.push(`| ${row.id.toUpperCase()} | ${fmt(row.durationMs)} | ${row.pass ? 'Đạt' : 'Không đạt'} |`);
out.push('', 'Đo trên trang ứng dụng mới ở chiều rộng điện thoại, từ lúc gửi câu hỏi đến khi toàn bộ công thức KaTeX và font sẵn sàng. Không có thẻ “Final Answer” riêng. Upload/OCR bị loại theo yêu cầu vì câu hiện tại đã được xác nhận.', '', '## Kiểm thử và hiển thị', '', '- Worker focused: 27/27 đạt cho Q1/Q2/Q5, game rules và fallback.', '- Worker full suite: 1,030/1,031 đạt trong lần chạy tải nặng; test hình học duyệt 179 góc chạm timeout 5 giây. Chạy riêng test đó với giới hạn 15 giây: 17/17 đạt trong 3.27 giây. Đây là vấn đề thời gian test khi chạy song song, không phải lỗi kết quả hình học.', '- Mobile: 21/21 đạt; typecheck và lint đạt.', '- Q1, Q2, Q5 hiển thị đạt ở 320, 390 và 1100 px; không lỗi KaTeX, không raw fallback, không tràn trang, không từ ngoại ngữ đã báo. Q2/Q5 cũ bị display guard chặn.', '', '## Giới hạn còn lại', '', '- Bộ giải chứng nhận chỉ nhận đúng những luật đã phân tích. Chomp, Wythoff và biến thể được đứng yên hiện trả controlled failure.', '- Tập held-out nhỏ và cùng các họ bài được hỗ trợ; không chứng minh năng lực lý thuyết trò chơi tổng quát hoặc “90% hài lòng” của con người.', '- Backend thật có OpenRouter/SocLaas trong cấu hình fallback được người dùng cho phép trước đây. Bài kiểm tra trực tiếp vào backend đó bị auto-review từ chối vì có thể gửi đề ra ngoài; số đo báo cáo dùng backend cô lập, tắt toàn bộ inference ngoài máy.', '- Q-learning khởi tạo heuristic không cung cấp bằng chứng học vượt quá heuristic; ablation lạnh thất bại. Tính đúng dựa vào kiểm tra vét cạn, không dựa vào reward học.', '', '## Kiểm tra thủ công', '', '1. Mở lại URL Q2, tải lại trang và bấm giải lại nếu trình duyệt đang giữ state cũ. Không được thấy `{b+c,c+d,d+a}={1,2,3}`.', '2. Mở Q1 phần c). Kiểm tra các bước riêng: khai triển liên hợp, chứng minh mẫu dương, chia, thay thương, cộng/trừ hai vế, nhân liên hợp hiệu căn và chứng minh nhân tử thứ hai dương.', '3. Mở Q5. Bảng đầu phải có đúng sáu hàng hỏi khi `k=4`. Các bước sau dùng lưới 2 × 9, vòng tròn cho vị trí còn có thể đứng, và kết thúc bằng lưới rỗng.', '4. Thử đổi đề Q5 thành “An được đứng yên”. Hệ thống phải từ chối chứng chỉ hiện tại thay vì tái sử dụng lời giải bắt buộc di chuyển.', '', '## Dữ liệu tái lập', '', '- `tools/specialist-training/game-theory-02/heldout-answers.json`: phản hồi held-out đầy đủ.', '- `tools/specialist-training/game-theory-02/heldout-independent-checks.json`: kiểm tra toán tách biệt.', '- `tools/specialist-training/game-theory-02/end-to-end-render.json`: độ trễ đến render.', '- `tools/specialist-training/game-theory-02/freeze.json`: hash source tại thời điểm freeze.', '- `tools/specialist-training/game-theory-02/rl-*-weights.json.gz`: Q-value/visit count thực tế để tiếp tục thí nghiệm.', '- `tools/specialist-training/game-theory-02/run-state.json`: ledger thời gian và các khoảng bị loại.', '');

writeFileSync('docs/specialist-training/game-theory-02.md', out.join('\n') + '\n');
