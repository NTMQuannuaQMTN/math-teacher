/**
 * Technique retrieval for Toán chuyên problems (no model call).
 *
 * A deterministic cue match on the problem text selects up to three "method cards": short, general
 * reminders of the technique a Vietnamese teacher would reach for on that type of problem. The cards come
 * from the knowledge map of past entrance exams (data/techniques/taxonomy.json, docs/MATHEMATICAL_KNOWLEDGE_MAP.md);
 * they name techniques, never a specific problem's answer, so they cannot leak exam solutions.
 */
export interface TechniqueCard {
  id: string;
  /** Cues in the problem text (all of `all` and at least one of `any`). */
  all?: RegExp[];
  any: RegExp[];
  /** Higher first when more than three cards match. */
  priority: number;
  /** The reminder sent to the model (Vietnamese, school terminology). */
  hint: string;
}

const PROOF = /chứng minh|chứng tỏ/iu;

export const TECHNIQUE_CARDS: TechniqueCard[] = [
  {
    id: "tech.subtract_equations",
    any: [/nghiệm chung/iu, /[xyz]\^\{?\d\}?\s*\+\s*[xyz]\^\{?\d\}?\s*=\s*[xyz]\b/iu],
    priority: 5,
    hint: "Hệ đối xứng/hoán vị vòng quanh hoặc hai phương trình có nghiệm chung: trừ vế theo vế để xuất hiện nhân tử (x − y) (hoặc (a − b)), rồi xét từng trường hợp; nhân tử còn lại thường luôn dương.",
  },
  {
    id: "tech.change_of_variables",
    all: [/hệ phương trình|\\begin\{cases\}/iu],
    any: [/\\frac\{1\}\{[xy]\}|\\frac\{1\}\{xy\}|x\s*\+\s*y\s*\+\s*xy/iu],
    priority: 4,
    hint: "Hệ có các biểu thức lặp lại (như 4x + 1/x, x + y, xy): đặt ẩn phụ cho các biểu thức đó; nếu biết tổng và tích của hai ẩn phụ thì chúng là nghiệm của một phương trình bậc hai (Vi-ét đảo).",
  },
  {
    id: "alg.vieta_parameter",
    any: [/x_\{?1\}?.*x_\{?2\}?|tham số|hai nghiệm/iu],
    all: [/phương trình|x\^\{?2\}?/iu],
    priority: 5,
    hint: "Phương trình bậc hai có tham số: trước hết tìm điều kiện có nghiệm (Δ hoặc Δ' > 0), sau đó dùng Vi-ét (S, P). Với biểu thức không đối xứng của x₁, x₂, dùng chính phương trình (x₁² = …) hoặc kết hợp S với hệ thức đề cho để tìm từng nghiệm; cuối cùng đối chiếu điều kiện.",
  },
  {
    id: "nt.divisibility_cases",
    any: [/chia hết|ước chung lớn nhất|chia cho \d+ dư/iu],
    priority: 4,
    hint: "Chia hết: phân tích thành nhân tử, rồi xét số dư theo modulo nhỏ (2, 3, 4, 9…). Nếu đề có ước chung lớn nhất d của m, n thì đặt m = dx, n = dy với (x, y) = 1. Kết luận bằng lời (\"n chia 3 dư 1\", \"n = 18k + 16\").",
  },
  {
    id: "nt.integer_solutions",
    any: [/nghiệm nguyên|cặp số nguyên|số nguyên dương \(?x|số nguyên \(x/iu],
    priority: 4,
    hint: "Nghiệm nguyên: đổi biến để phương trình gọn (u = y − x, …), đưa về dạng tích bằng hằng số hoặc A ⋮ B rồi chặn (|A| > |B| ⇒ B = 0); thử lại mọi nghiệm tìm được.",
  },
  {
    id: "alg.inequality_proof",
    // An algebraic inequality to prove (non-strict signs or a bound like "> 9/2"), not a geometry figure's AB < AC.
    all: [PROOF, /^(?!.*(tam giác|đường tròn|tứ giác|hình vuông|thẻ|bảng))/isu],
    any: [/\\(ge|le|geq|leq)(?![a-z])|≥|≤|bất đẳng thức|[<>]\s*\\(frac|sqrt)/u],
    priority: 3,
    hint: "Chứng minh bất đẳng thức có điều kiện: biến đổi giả thiết trước (ví dụ ab + bc + ca = abc ⇔ 1/a + 1/b + 1/c = 1), rồi dùng (a − b)² ≥ 0, (x + y + z)² ≥ 3(xy + yz + zx), Cô-si hoặc Bunhiacopxki; luôn chỉ ra khi nào dấu bằng xảy ra.",
  },
  {
    id: "alg.extremum",
    any: [/(?<!chung )(lớn|nhỏ) nhất|nhiều nhất|ít nhất/iu],
    priority: 4,
    hint: "Tìm giá trị lớn nhất/nhỏ nhất: đánh giá (hoàn thành bình phương, Cô-si, Bunhiacopxki) để được một chặn, rồi chỉ ra trường hợp dấu bằng thật sự đạt được và thỏa mọi điều kiện của đề.",
  },
  {
    id: "comb.grid",
    any: [/bảng (ô vuông|hình vuông)|tô màu|\\times\s*\d|ô (đen|trắng)/iu],
    priority: 4,
    hint: "Bảng ô vuông/tô màu: đếm cùng một đại lượng theo hàng và theo cột (đếm hai cách), xét chẵn lẻ hoặc tô màu bàn cờ, dùng nguyên lý cực hạn để chặn, và chỉ ra một cách tô cụ thể đạt giá trị tốt nhất.",
  },
  {
    id: "nt.perfect_square",
    any: [/số chính phương/iu],
    priority: 3,
    hint: "Số chính phương: kẹp giữa hai bình phương liên tiếp k² < N < (k + 1)², hoặc xét số dư của bình phương (mod 3, 4, 8).",
  },
  {
    id: "alg.recurrence",
    any: [/a_\{?n\s*\+\s*[12]\}?|a_\{?n\}?\s*=\s*\(/iu],
    priority: 4,
    hint: "Dãy dạng (α)ⁿ + (β)ⁿ: α, β là nghiệm của t² − (α + β)t + αβ = 0 nên dãy thỏa hệ thức truy hồi; tính chia hết bằng cách lập bảng số dư cho đến khi lặp lại (tuần hoàn).",
  },
  {
    id: "geo.cyclic_proof",
    all: [PROOF],
    any: [/nội tiếp|cùng thuộc một đường tròn|đường tròn/iu],
    priority: 3,
    hint: "Hình học đường tròn: chứng minh nội tiếp bằng hai góc bằng nhau cùng nhìn một cạnh (hoặc hai góc vuông), biến đổi góc qua góc nội tiếp và góc tạo bởi tiếp tuyến – dây; đẳng thức tích đoạn thẳng (MA·MB = MC·MD) đến từ tam giác đồng dạng.",
  },
  {
    id: "geo.orthocenter_diameter",
    all: [/trực tâm|đường cao/iu],
    any: [/đường kính/iu],
    priority: 4,
    hint: "Trực tâm H và đường kính AK của đường tròn ngoại tiếp: BHCK là hình bình hành, nên trung điểm BC là trung điểm HK (H, M, K thẳng hàng).",
  },
  {
    id: "geo.incircle",
    any: [/nội tiếp tam giác|tiếp điểm|đường tròn \(I\)/iu],
    priority: 3,
    hint: "Đường tròn nội tiếp (I): hai tiếp tuyến kẻ từ một điểm bằng nhau, AI là phân giác, ID vuông góc BC tại tiếp điểm; các góc vuông tại tiếp điểm cho nhiều tứ giác nội tiếp.",
  },
  {
    id: "geo.concurrency",
    all: [PROOF],
    any: [/đồng quy|thẳng hàng/iu],
    priority: 2,
    hint: "Thẳng hàng/đồng quy: chứng minh giao điểm của hai đường nằm trên đường thứ ba (hoặc góc bẹt 180°); thường cần một bổ đề phụ hoặc một điểm phụ được định nghĩa lại.",
  },
  {
    id: "prob.integer_roots",
    any: [/xác suất/iu],
    priority: 3,
    hint: "Xác suất: đếm chính xác số phần tử của không gian mẫu và số kết quả thuận lợi. Nếu điều kiện là \"các nghiệm đều nguyên\", khử tham số giữa S và P bằng Vi-ét rồi đưa về tích bằng hằng số.",
  },
  {
    id: "word.motion",
    any: [/km\/h|vận tốc|giao lộ|quãng đường/iu],
    priority: 3,
    hint: "Bài toán chuyển động: đặt ẩn với điều kiện, lập phương trình; xét cả trường hợp vật đã vượt qua điểm mốc (khoảng cách đổi dấu).",
  },
  {
    id: "alg.radical_equation",
    all: [/giải phương trình/iu],
    any: [/\\sqrt\[?4?\]?|\\sqrt\{/u],
    priority: 3,
    hint: "Phương trình chứa căn: đặt điều kiện, so sánh hiệu các biểu thức dưới căn (hai vế có thể chênh lệch cùng một lượng), dùng tính đơn điệu; nghiệm có thể chỉ \"chạm\" 0 nên luôn thử lại bằng cách thay vào.",
  },
  {
    id: "comb.pigeonhole_extremal",
    any: [/luôn chứa|chọn ra|tập hợp con|nguyên lý/iu],
    priority: 2,
    hint: "Tồn tại/luôn có: nguyên lý Dirichlet hoặc phản chứng với nguyên lý cực hạn (sắp xếp tăng dần; nếu không có bộ thỏa mãn thì dãy phải tăng nhanh như Fibonacci…).",
  },
];

/** Up to `max` cards whose cues match the problem text, best first. */
export function selectTechniques(problemText: string, max = 3): TechniqueCard[] {
  const text = problemText.normalize("NFC");
  return TECHNIQUE_CARDS.filter((card) => (card.all ?? []).every((re) => re.test(text)) && card.any.some((re) => re.test(text)))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, max);
}

/** The paragraph added to the user message, or "" when nothing matches. */
export function techniqueHints(problemText: string): string {
  const cards = selectTechniques(problemText);
  if (cards.length === 0) return "";
  return `Phương pháp thường dùng cho dạng bài này (tham khảo; chỉ dùng nếu thật sự phù hợp, và vẫn tự kiểm tra lời giải):\n${cards.map((c) => `- ${c.hint}`).join("\n")}`;
}
