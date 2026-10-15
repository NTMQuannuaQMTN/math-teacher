import { readFileSync, writeFileSync } from "node:fs";

const topic = process.argv[2] ?? "algebra";
const title = { algebra: "Algebra", geometry: "Geometry", number_theory: "Number Theory", combinatorics: "Combinatorics" }[topic] ?? topic;
const files = [
  `tools/specialist-training/iteration-04/${topic}-final-development.jsonl`,
  `tools/specialist-training/iteration-04/${topic}-final-held-out.jsonl`,
];
const rows = files.flatMap((file) => readFileSync(file, "utf8").trim().split("\n").filter(Boolean).map(JSON.parse));
const source = (value) => value.url ? `[${value.name}](${value.url})` : `${value.name}${value.local ? ` (${value.local})` : ""}`;
const math = (value) => value ? `\n\n$$\n${value}\n$$` : "";
const block = (row, index) => {
  const lesson = row.response?.solution?.lesson;
  const header = `### ${index + 1}. ${row.id} — ${row.split === "held-out" ? "held-out" : "development"}`;
  const facts = [
    `- **Nguồn:** ${source(row.source)}`,
    `- **Độ trễ đầu cuối:** ${row.durationMs.toFixed(0)} ms`,
    `- **Kết quả ứng dụng:** ${row.status}; kiểm tra: ${row.verificationStatus ?? "không có"}; mô hình: ${row.model ?? "không có"}`,
    `- **Kiểm tra hiển thị:** ${row.qualityPass ? "đạt (schema, LaTeX và ngôn ngữ)" : "không có bài học để kiểm tra"}`,
  ].join("\n");
  let answer;
  if (!lesson) {
    answer = [
      "**Phản hồi thực tế được hiển thị**",
      "",
      "> Chưa chuẩn bị được bài học",
      ">",
      "> Bài này khó và lần này chưa giải xong. Bài vẫn nằm trong chương trình lớp 9 — bạn thử lại nhé.",
      "",
      `Mã kiểm soát từ API: \`${row.response?.solution?.error?.code ?? "unknown"}\`; có thể thử lại: \`${row.response?.solution?.error?.retryable ?? false}\`.`,
    ].join("\n");
  } else {
    const hints = lesson.hints.map((hint, i) => [
      `**Gợi ý ${i + 1}: ${hint.question}**`,
      "",
      hint.cue,
      "",
      hint.explanation,
      math(hint.math),
    ].join("\n")).join("\n\n");
    const steps = lesson.steps.map((step, i) => [
      `**Bước ${i + 1}: ${step.title}**`,
      "",
      step.explanation,
      math(step.math),
      "",
      `*Lý do:* ${step.reason}`,
    ].join("\n")).join("\n\n");
    answer = [
      `**Chiến lược:** ${lesson.strategy}`,
      "",
      "#### Gợi ý thực tế",
      "",
      hints,
      "",
      "#### Lời giải thực tế",
      "",
      steps,
    ].join("\n");
  }
  return [
    header, "", facts, "", "**Câu hỏi**", "", row.question, "", answer, "",
    "**Đối chiếu độc lập**", "", `- Đáp án tham chiếu: ${row.reference.answer}`,
    `- Cách kiểm tra: ${row.reference.verification}`,
    `- Kết luận tự kiểm tra: ${lesson && row.fragmentPass && row.qualityPass ? "đạt" : lesson ? "cần xem lại" : "phản hồi kiểm soát đúng hạn nhưng chưa giải được"}.`,
    "", "**Bạn đánh giá**", "", "- Điểm (1–5):", "- Sai sót toán học hoặc bước tắt:", "- Vấn đề tiếng Việt/LaTeX:", "- Góp ý khác:",
  ].join("\n");
};
const section = [`## ${title}`, "", ...rows.map(block)].join("\n\n") + "\n";
const reviewPath = "docs/specialist-training/iteration-04/review.md";
let review = readFileSync(reviewPath, "utf8");
const begin = `<!-- ${topic}:begin -->`, end = `<!-- ${topic}:end -->`;
if (!review.includes(begin)) {
  const heading = `## ${title}`;
  const start = review.indexOf(heading);
  const next = review.indexOf("\n## ", start + heading.length);
  review = `${review.slice(0, start)}${begin}\n${section}${end}\n${next < 0 ? "" : review.slice(next + 1)}`;
} else {
  review = `${review.slice(0, review.indexOf(begin))}${begin}\n${section}${end}${review.slice(review.indexOf(end) + end.length)}`;
}
writeFileSync(reviewPath, review);
