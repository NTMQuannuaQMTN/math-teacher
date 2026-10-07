/**
 * The agreed knowledge base for Toán chuyên vào 10 — the HARD boundary for solution methods
 * (docs/CURRICULUM_KNOWLEDGE_BASE.md). Topics and techniques have stable ids; the solver prompt includes only
 * the domains relevant to a problem, the model declares the technique ids it used, and the verifier checks
 * them and scans the text for methods outside the boundary (gradeLevel.ts).
 */

export type Domain = "algebra" | "geometry" | "number_theory" | "combinatorics";

export interface KbTopic {
  id: string;
  vi: string;
  items: string[];
}

export interface KbTechnique {
  id: string;
  vi: string;
  domain: Domain | "cross";
  /** Allowed, but only when the problem's level calls for it (chuyên configurations). */
  advanced?: boolean;
}

export const KB_TOPICS: Record<Domain, KbTopic[]> = {
  algebra: [
    { id: "A1", vi: "Biểu thức đại số", items: ["hằng đẳng thức", "phân tích nhân tử", "phân thức", "biểu thức chứa căn", "rút gọn, biến đổi", "biểu thức đối xứng"] },
    { id: "A2", vi: "Phương trình và hệ phương trình", items: ["bậc nhất", "bậc hai", "bậc cao", "chứa căn", "chứa ẩn ở mẫu", "hệ bậc nhất", "hệ không mẫu mực", "có tham số", "nghiệm nguyên"] },
    { id: "A3", vi: "Hàm số bậc hai và đa thức", items: ["hàm số bậc nhất, bậc hai và đồ thị", "đồng nhất thức đa thức", "nghiệm và hệ số", "định lý Viète", "chia hết đa thức"] },
    { id: "A4", vi: "Bất đẳng thức", items: ["biến đổi tương đương", "AM-GM (Cô-si)", "Cauchy–Schwarz (Bunhiacopxki) dạng sơ cấp", "sắp xếp lại, so sánh", "bất đẳng thức chứa căn", "bất đẳng thức có tham số", "chứng minh bất đẳng thức"] },
    { id: "A5", vi: "Cực trị", items: ["giá trị lớn nhất, nhỏ nhất", "hoàn thành bình phương", "đặt ẩn phụ", "điều kiện dấu bằng", "cực trị có điều kiện"] },
  ],
  geometry: [
    { id: "B1", vi: "Hình học phẳng cơ bản", items: ["góc", "song song, vuông góc", "tam giác bằng nhau", "tam giác đồng dạng", "định lý Pythagore", "các điểm đặc biệt của tam giác", "dựng hình cơ bản"] },
    { id: "B2", vi: "Đường tròn", items: ["góc ở tâm, góc nội tiếp", "dây và cung", "tiếp tuyến, cát tuyến", "tứ giác nội tiếp", "phương tích", "trục đẳng phương, dây chung"] },
    { id: "B3", vi: "Chứng minh hình học", items: ["thẳng hàng", "đồng quy", "vuông góc", "bằng nhau (đoạn, góc)", "nội tiếp", "đường phụ", "kết hợp đồng dạng và đường tròn"] },
    { id: "B4", vi: "Hệ thức lượng và tỉ số", items: ["độ dài, khoảng cách", "diện tích, tỉ số diện tích", "tỉ số đoạn thẳng", "hệ thức từ đồng dạng", "tỉ số lượng giác của góc nhọn, hệ thức lượng trong tam giác vuông", "bất đẳng thức hình học"] },
    { id: "B5", vi: "Cấu hình nâng cao (chỉ khi phù hợp)", items: ["trực tâm", "đường tròn nội tiếp, bàng tiếp", "đường thẳng Simson", "Ceva, Menelaus", "phép vị tự", "đồng dạng xoắn", "quỹ tích, cực trị hình học"] },
  ],
  number_theory: [
    { id: "C1", vi: "Chia hết và số nguyên tố", items: ["tính chất chia hết", "số nguyên tố, hợp số", "phân tích thừa số nguyên tố", "ƯCLN, BCNN", "thuật toán Euclid", "chứng minh chia hết"] },
    { id: "C2", vi: "Số dư và đồng dư", items: ["chẵn lẻ", "số dư", "đồng dư", "lũy thừa theo mođun", "chia hết bằng đồng dư"] },
    { id: "C3", vi: "Phương trình nghiệm nguyên", items: ["phương trình Diophantine", "nghiệm nguyên, tự nhiên", "chặn ẩn", "phân tích nhân tử", "phương trình bậc nhất hai ẩn", "bộ ba Pythagore"] },
    { id: "C4", vi: "Tính chất đặc biệt của số nguyên", items: ["số chính phương, lập phương", "số ước và tổng ước", "dãy số, quy luật", "số mũ của thừa số nguyên tố", "số nguyên liên tiếp", "bất đẳng thức số nguyên"] },
  ],
  combinatorics: [
    { id: "D1", vi: "Đếm", items: ["quy tắc nhân, cộng", "hoán vị", "tổ hợp", "đếm theo trường hợp", "đếm phần bù", "bao hàm – loại trừ"] },
    { id: "D2", vi: "Lập luận tổ hợp", items: ["nguyên lý Dirichlet", "nguyên lý cực hạn", "bất biến", "đơn biến", "chẵn lẻ", "đếm bằng hai cách"] },
    { id: "D3", vi: "Xác suất và bài toán rời rạc", items: ["xác suất cơ bản", "đếm kết quả", "đếm có điều kiện", "sắp xếp có ràng buộc"] },
    { id: "D4", vi: "Logic và chứng minh", items: ["chứng minh trực tiếp", "phản chứng", "quy nạp", "xét trường hợp", "điều kiện cần và đủ", "lập luận xây dựng"] },
  ],
};

export const KB_CROSS = ["biến đổi đại số", "lập luận logic", "xét trường hợp", "phản chứng", "đặt ẩn phụ", "đánh giá (chặn)", "tìm quy luật", "dựng đối tượng phụ", "trình bày toán học", "lý giải mọi suy luận quan trọng"];

/** Technique ids the model may declare in analysis.techniques. */
export const KB_TECHNIQUES: KbTechnique[] = [
  { id: "factorization", vi: "Phân tích nhân tử, hằng đẳng thức", domain: "algebra" },
  { id: "substitution", vi: "Đặt ẩn phụ", domain: "cross" },
  { id: "subtract_equations", vi: "Trừ (cộng) vế theo vế", domain: "algebra" },
  { id: "vieta", vi: "Định lý Viète", domain: "algebra" },
  { id: "discriminant", vi: "Biệt thức Δ", domain: "algebra" },
  { id: "domain_conditions", vi: "Điều kiện xác định, kiểm tra nghiệm", domain: "algebra" },
  { id: "complete_square", vi: "Hoàn thành bình phương", domain: "algebra" },
  { id: "am_gm", vi: "Bất đẳng thức Cô-si (AM-GM)", domain: "algebra" },
  { id: "cauchy_schwarz", vi: "Bất đẳng thức Bunhiacopxki (Cauchy–Schwarz)", domain: "algebra" },
  { id: "equality_case", vi: "Xét điều kiện dấu bằng", domain: "algebra" },
  { id: "monotonicity", vi: "So sánh, đơn điệu", domain: "algebra" },
  { id: "angle_chasing", vi: "Biến đổi góc", domain: "geometry" },
  { id: "congruent_triangles", vi: "Tam giác bằng nhau", domain: "geometry" },
  { id: "similar_triangles", vi: "Tam giác đồng dạng", domain: "geometry" },
  { id: "cyclic_quadrilateral", vi: "Tứ giác nội tiếp", domain: "geometry" },
  { id: "inscribed_angle", vi: "Góc nội tiếp, góc tạo bởi tiếp tuyến và dây", domain: "geometry" },
  { id: "power_of_point", vi: "Phương tích, hệ thức tích đoạn thẳng", domain: "geometry" },
  { id: "pythagoras", vi: "Định lý Pythagore, hệ thức lượng tam giác vuông", domain: "geometry" },
  { id: "thales", vi: "Định lý Thales, tỉ số đoạn thẳng", domain: "geometry" },
  { id: "area_ratio", vi: "Diện tích, tỉ số diện tích", domain: "geometry" },
  { id: "auxiliary_construction", vi: "Dựng đường phụ", domain: "geometry" },
  { id: "radical_axis", vi: "Trục đẳng phương", domain: "geometry", advanced: true },
  { id: "ceva_menelaus", vi: "Định lý Ceva, Menelaus", domain: "geometry", advanced: true },
  { id: "simson", vi: "Đường thẳng Simson", domain: "geometry", advanced: true },
  { id: "homothety", vi: "Phép vị tự", domain: "geometry", advanced: true },
  { id: "spiral_similarity", vi: "Đồng dạng xoắn", domain: "geometry", advanced: true },
  { id: "divisibility", vi: "Tính chất chia hết", domain: "number_theory" },
  { id: "remainders", vi: "Xét số dư, đồng dư", domain: "number_theory" },
  { id: "parity", vi: "Chẵn lẻ", domain: "cross" },
  { id: "gcd", vi: "ƯCLN, BCNN, thuật toán Euclid", domain: "number_theory" },
  { id: "bounding", vi: "Chặn (đánh giá)", domain: "cross" },
  { id: "perfect_squares", vi: "Số chính phương", domain: "number_theory" },
  { id: "counting", vi: "Đếm (quy tắc nhân, tổ hợp)", domain: "combinatorics" },
  { id: "pigeonhole", vi: "Nguyên lý Dirichlet", domain: "combinatorics" },
  { id: "extremal", vi: "Nguyên lý cực hạn", domain: "combinatorics" },
  { id: "invariant", vi: "Bất biến, đơn biến", domain: "combinatorics" },
  { id: "double_counting", vi: "Đếm bằng hai cách", domain: "combinatorics" },
  { id: "construction", vi: "Chỉ ra ví dụ (xây dựng)", domain: "cross" },
  { id: "contradiction", vi: "Phản chứng", domain: "cross" },
  { id: "induction", vi: "Quy nạp", domain: "cross" },
  { id: "case_analysis", vi: "Xét trường hợp", domain: "cross" },
  { id: "necessary_sufficient", vi: "Điều kiện cần và đủ", domain: "cross" },
];

/** Outside the boundary: never used (the verifier sends such a lesson back). */
export const KB_OUTSIDE = [
  "calculus (derivatives, integrals, limits)",
  "vectors, matrices, complex numbers, logarithms, university linear or abstract algebra",
  "coordinates as a shortcut for a synthetic geometry problem that doesn't mention coordinates",
  "the laws of sines/cosines for non-right triangles",
  "inversion, pole/polar, harmonic division, cross-ratio, antiparallel lines, nine-point circle, Euler line",
  "olympiad-only inequalities (Jensen, Schur, Hölder, Minkowski)",
  "the Chinese remainder theorem (combine remainder conditions by hand instead)",
];

const TECHNIQUE_IDS = new Set(KB_TECHNIQUES.map((t) => t.id));
export const isKnownTechnique = (id: string) => TECHNIQUE_IDS.has(id);
export const techniqueName = (id: string) => KB_TECHNIQUES.find((t) => t.id === id)?.vi ?? null;

const CUES: Record<Exclude<Domain, "algebra">, RegExp> = {
  geometry: /tam giác|tứ giác|đường tròn|tiếp tuyến|góc|vuông góc|song song|trung điểm|đường cao|nội tiếp|đoạn thẳng|đường thẳng|cắt nhau|hình (vuông|chữ nhật|thang|thoi|bình hành)|\\widehat|\\triangle|triangle|circle/iu,
  number_theory: /chia hết|số nguyên|số tự nhiên|nguyên tố|ước|bội|số dư|chia .* dư|chính phương|nghiệm nguyên|\\vdots|⋮|\bmod\b/iu,
  combinatorics: /bảng|ô vuông|tô màu|số cách|có bao nhiêu|xác suất|tập hợp|chọn ra|sắp xếp|trò chơi|lượt|thẻ|dirichlet/iu,
};

/** The domains a problem draws on (deterministic cue match; algebra is always included). */
export function problemDomains(text: string): Domain[] {
  const t = text.normalize("NFC");
  return ["algebra", ...(Object.keys(CUES) as Exclude<Domain, "algebra">[]).filter((d) => CUES[d].test(t))] as Domain[];
}
