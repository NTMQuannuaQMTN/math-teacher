"""
Builds the chuyên dataset files from catalog.py (and the PTNK 2026 items already in tools/benchmark).

  python3 tools/exams/build_dataset.py

Writes (all generated; edit catalog.py, not these):
  data/exam_sources.json              source manifest (sha256 of the local files when present)
  data/exams/<exam>.json              one file per exam: metadata + questions
  data/processed/problems.jsonl       one record per (sub-)question
  data/knowledge/profiles.jsonl       knowledge profile per question
  data/knowledge/graph.json           concept → technique → question index (for queries)
  data/techniques/taxonomy.json       concept and technique definitions
  data/{training,validation,test}/problems.jsonl   exam-level split
  tools/benchmark/dataset/chuyen.jsonl  benchmark items (solver evaluation, scripts/benchmark.ts --dataset chuyen)
"""
import hashlib
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import catalog  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"

# --------------------------------------------------------------------------- taxonomy
CONCEPTS = {
    "alg.identities": ("Hằng đẳng thức, biến đổi đồng nhất", "standard_grade9", []),
    "alg.factorization": ("Phân tích đa thức thành nhân tử", "standard_grade9", ["alg.identities"]),
    "alg.rational_expressions": ("Biểu thức phân thức, điều kiện xác định", "standard_grade9", ["alg.factorization"]),
    "alg.radicals": ("Căn bậc hai, căn bậc ba, biến đổi biểu thức chứa căn", "standard_grade9", ["alg.identities"]),
    "alg.radicals_domain": ("Điều kiện xác định của căn, phương trình chứa căn", "standard_grade9", ["alg.radicals"]),
    "alg.linear_equation": ("Phương trình bậc nhất", "standard_grade9", []),
    "alg.system_linear": ("Hệ phương trình bậc nhất", "standard_grade9", ["alg.linear_equation"]),
    "alg.system_nonlinear": ("Hệ phương trình không mẫu mực (đặt ẩn phụ, thế)", "specialized_grade9", ["alg.system_linear", "alg.factorization"]),
    "alg.system_symmetric": ("Hệ đối xứng / hoán vị vòng quanh", "specialized_grade9", ["alg.system_nonlinear"]),
    "alg.discriminant": ("Biệt thức Δ, Δ'", "standard_grade9", []),
    "alg.vieta": ("Hệ thức Vi-ét", "standard_grade9", ["alg.discriminant"]),
    "alg.quadratic_extremum": ("Cực trị hàm bậc hai (hoàn thành bình phương)", "standard_grade9", ["alg.identities"]),
    "alg.inequality_basic": ("Tính chất bất đẳng thức, so sánh", "standard_grade9", []),
    "alg.square_sum_nonneg": ("Tổng bình phương không âm, (a−b)² ≥ 0", "standard_grade9", ["alg.identities"]),
    "alg.am_gm": ("Bất đẳng thức Cô-si (AM–GM)", "specialized_grade9", ["alg.square_sum_nonneg"]),
    "alg.recurrence": ("Dãy truy hồi tuyến tính", "specialized_grade9", ["alg.vieta"]),
    "alg.function_monotonic": ("Tính đơn điệu của biểu thức/hàm số", "specialized_grade9", ["alg.inequality_basic"]),
    "nt.parity": ("Tính chẵn lẻ", "standard_grade9", []),
    "nt.divisibility": ("Quan hệ chia hết", "standard_grade9", []),
    "nt.modular_arithmetic": ("Đồng dư, xét số dư", "specialized_grade9", ["nt.divisibility"]),
    "nt.gcd": ("Ước chung lớn nhất, nguyên tố cùng nhau", "standard_grade9", ["nt.divisibility"]),
    "nt.perfect_squares": ("Số chính phương", "standard_grade9", []),
    "nt.quadratic_forms": ("Số biểu diễn dạng a² + kb²", "specialized_grade9", ["nt.perfect_squares", "nt.modular_arithmetic"]),
    "nt.diophantine": ("Phương trình nghiệm nguyên", "specialized_grade9", ["nt.divisibility", "alg.factorization"]),
    "nt.exponential": ("Lũy thừa, phương trình mũ nghiệm nguyên", "specialized_grade9", ["nt.diophantine"]),
    "nt.rationals_fractions": ("Số hữu tỉ, phân số tối giản", "standard_grade9", ["nt.gcd"]),
    "nt.rational_irrational": ("Số hữu tỉ, số vô tỉ", "standard_grade9", []),
    "comb.counting": ("Đếm", "standard_grade9", []),
    "comb.double_counting": ("Đếm bằng hai cách", "specialized_grade9", ["comb.counting"]),
    "comb.extremal": ("Nguyên lý cực hạn, xét phần tử lớn/nhỏ nhất", "specialized_grade9", []),
    "comb.pigeonhole": ("Nguyên lý Dirichlet", "specialized_grade9", []),
    "comb.graph_coloring": ("Tô màu, đồ thị (ngôn ngữ cặp/kề)", "olympiad_style", ["comb.pigeonhole"]),
    "comb.game_strategy": ("Trò chơi, chiến thuật", "olympiad_style", []),
    "comb.invariant": ("Bất biến (tô màu, chẵn lẻ)", "specialized_grade9", ["nt.parity"]),
    "comb.construction": ("Xây dựng ví dụ", "specialized_grade9", []),
    "prob.classical": ("Xác suất cổ điển", "standard_grade9", ["comb.counting"]),
    "stat.read_chart": ("Đọc biểu đồ, tỉ lệ", "standard_grade9", []),
    "word.motion": ("Bài toán chuyển động", "standard_grade9", ["alg.linear_equation"]),
    "geo.triangle_inequality": ("Bất đẳng thức tam giác", "standard_grade9", []),
    "geo.trig_ratios": ("Tỉ số lượng giác góc nhọn", "standard_grade9", []),
    "geo.trapezoid_area": ("Diện tích hình thang", "standard_grade9", []),
    "geo.similar_triangles": ("Tam giác đồng dạng", "standard_grade9", []),
    "geo.angle_bisector_theorem": ("Tính chất đường phân giác (tỉ số)", "standard_grade9", ["geo.similar_triangles"]),
    "geo.angle_bisector_external": ("Phân giác ngoài", "specialized_grade9", ["geo.angle_bisector_theorem"]),
    "geo.cyclic_quad": ("Tứ giác nội tiếp, góc nội tiếp", "standard_grade9", []),
    "geo.tangent_properties": ("Tiếp tuyến, góc tạo bởi tiếp tuyến và dây", "standard_grade9", ["geo.cyclic_quad"]),
    "geo.incircle_tangents": ("Đường tròn nội tiếp, tiếp điểm", "specialized_grade9", ["geo.tangent_properties"]),
    "geo.power_of_point": ("Phương tích (hệ thức MA·MB = MC·MD)", "specialized_grade9", ["geo.similar_triangles", "geo.cyclic_quad"]),
    "geo.orthocenter": ("Trực tâm, đường cao", "standard_grade9", []),
    "geo.midpoint_parallel": ("Trung điểm, đường trung bình, song song", "standard_grade9", []),
    "geo.perpendicular_bisector": ("Đường trung trực", "standard_grade9", []),
    "geo.reflection": ("Phép đối xứng trục", "specialized_grade9", []),
    "geo.isosceles_trapezoid": ("Hình thang cân", "standard_grade9", []),
    "geo.centroid": ("Trọng tâm", "standard_grade9", []),
}
TECHNIQUES = {
    "tech.change_of_variables": ("Đặt ẩn phụ", "Replace a repeated sub-expression by a new unknown."),
    "tech.sum_product_system": ("Đưa về tổng – tích (Vi-ét đảo)", "Two unknowns with known sum and product are the roots of a quadratic."),
    "tech.qm_am_bound": ("Bất đẳng thức (p+q+r)² ≤ 3(p²+q²+r²)", "Bound a sum by the sum of squares (and its relatives)."),
    "tech.am_gm_two": ("Cô-si cho hai số", "2√(xy) ≤ x + y for non-negative x, y."),
    "tech.use_constraint_reciprocal": ("Biến đổi giả thiết về dạng nghịch đảo", "ab+bc+ca=abc ⇔ 1/a+1/b+1/c=1."),
    "tech.use_constraint_substitution": ("Dùng giả thiết để thế", "Substitute the condition into the expression to simplify it."),
    "tech.double_counting": ("Đếm bằng hai cách", "Count the same quantity by rows and by columns (or from both sides)."),
    "tech.parity_mod": ("Xét chẵn lẻ / số dư", "Reduce modulo 2, 3, 4, … to restrict the cases."),
    "tech.bounding": ("Chặn (đánh giá)", "Bound the quantity to leave finitely many cases."),
    "tech.contradiction": ("Phản chứng", "Assume the opposite and reach a contradiction."),
    "tech.construction": ("Chỉ ra ví dụ", "Exhibit an object that attains the bound or satisfies the conditions."),
    "tech.subtract_equations": ("Trừ vế theo vế", "Subtract equations of a symmetric system to factor out x − y."),
    "tech.factor_and_case": ("Phân tích nhân tử rồi xét trường hợp", "A product equal to 0 (or to a known number) splits into cases."),
    "tech.case_analysis": ("Xét trường hợp", "Split by sign, parity, remainder or configuration."),
    "tech.squeeze_between_squares": ("Kẹp giữa hai số chính phương liên tiếp", "k² < N < (k+1)² ⇒ N is not a square."),
    "tech.right_angle_concyclic": ("Hai góc vuông cùng nhìn một đoạn ⇒ nội tiếp", "Points seeing a segment at 90° lie on the circle with that diameter."),
    "tech.angle_chasing": ("Biến đổi góc", "Chain equal angles (inscribed, tangent–chord, parallel lines)."),
    "tech.midline_symmetry": ("Đường trung bình, tính đối xứng của hình thang cân", "Use midpoints and the symmetry axis."),
    "tech.known_lemma": ("Dùng bổ đề quen thuộc", "Prove or quote a standard configuration lemma first."),
    "tech.auxiliary_parallel": ("Kẻ đường phụ song song", "Draw a parallel line to transfer a ratio or a midpoint."),
    "tech.rewrite_with_symmetric_sums": ("Biểu diễn qua tổng và tích (s, p)", "Rewrite symmetric expressions in a+b+c, ab+bc+ca (or S, P)."),
    "tech.square_completion": ("Hoàn thành bình phương", "Write as a square plus a constant to bound or solve."),
    "tech.characteristic_roots": ("Nghiệm của phương trình đặc trưng", "The two bases are roots of t² − 4t + 1 = 0."),
    "tech.periodicity_mod": ("Tính tuần hoàn theo modulo", "List residues until they repeat."),
    "tech.induction": ("Quy nạp", "Prove for all n from a base case and a step."),
    "tech.parallelogram_from_orthocenter": ("Hình bình hành từ trực tâm và đường kính", "BHCK is a parallelogram when AK is a diameter."),
    "tech.power_of_point": ("Phương tích / hệ thức tích đoạn thẳng", "Products of segments through a point on a circle are equal."),
    "tech.reflection": ("Đối xứng trục", "Reflect a point or a circle across a line."),
    "tech.similar_triangles": ("Tam giác đồng dạng", "Find two similar triangles to transfer angles or ratios."),
    "tech.angle_bisector_ratio": ("Tính chất tỉ số của phân giác", "A point divides the opposite side in the ratio of the adjacent sides."),
    "tech.isosceles_trapezoid_cyclic": ("Hình thang cân thì nội tiếp", "Symmetry gives an isosceles trapezoid, which is cyclic."),
    "tech.extremal_choice": ("Chọn trường hợp xấu nhất", "Apply the hypothesis to the most extreme choice."),
    "tech.pairing_differences": ("Ghép cặp hiệu", "Pair terms so each difference is bounded below."),
    "tech.pigeonhole": ("Nguyên lý Dirichlet", "More objects than boxes forces a box with two."),
    "tech.forced_chain": ("Chuỗi ép buộc", "Follow placements forced by the condition until a contradiction."),
    "tech.conjugate_multiplication": ("Nhân liên hợp", "(x+√(x²+1))(−x+√(x²+1)) = 1."),
    "tech.monotonicity": ("Đơn điệu ⇒ duy nhất", "An increasing expression takes each value once."),
    "tech.one_parameter_family": ("Họ nghiệm một tham số", "Express all solutions with one parameter, then optimise it."),
    "tech.substitution_m_kn": ("Đặt m = kn", "Use the divisibility to write one unknown as a multiple of the other."),
    "tech.gcd_decomposition": ("Đặt m = dx, n = dy với (x, y) = 1", "Split off the gcd and use coprimality."),
    "tech.sweep_strategy": ("Chiến thuật quét", "Check cells column by column so the target cannot escape."),
    "tech.parity_coloring": ("Tô màu bàn cờ", "A step to an adjacent cell always changes colour."),
    "tech.perfect_square_under_root": ("Nhận ra bình phương dưới căn", "After substitution the radicand becomes (…)²."),
    "tech.eliminate_parameter": ("Khử tham số", "Combine the equations to eliminate the extra unknown."),
    "tech.set_unknown": ("Đặt ẩn và lập phương trình", "Choose an unknown with its condition and translate the story."),
    "tech.small_case_search": ("Thử các trường hợp nhỏ", "Search small values systematically."),
    "tech.brahmagupta_identity": ("Hằng đẳng thức Brahmagupta", "(a²+kb²)(c²+kd²) = (ac∓kbd)² + k(ad±bc)²."),
    "tech.cross_ratio_harmonic": ("Tỉ số đoạn thẳng (hàng điểm điều hòa)", "Compare two ratios on a line through similar triangles."),
    "tech.vieta_integer_roots": ("Vi-ét cho nghiệm nguyên", "Eliminate the parameter between S and P, factor, list divisors."),
    "tech.fibonacci_growth": ("Tăng ít nhất như Fibonacci", "Without a triangle the sorted values grow like Fibonacci numbers."),
    "tech.shift_invariance": ("Tịnh tiến không đổi hiệu", "Differences are unchanged by a + t, b + t, c + t; choose t to minimise."),
    "tech.divisor_cases": ("Xét ước", "A divisibility A | B with |A| > |B| forces B = 0."),
    "tech.orthocenter_of_auxiliary_triangle": ("Trực tâm của tam giác phụ", "Spot that a point is the orthocenter of a helper triangle."),
    "tech.radical_axis_like_concurrency": ("Đồng quy qua các dây chung", "Common chords of three circles are concurrent (radical centre)."),
    "tech.equal_differences": ("Hai hiệu bằng nhau", "Notice the two sides differ by the same quantity."),
    "tech.cube_identity": ("Hằng đẳng thức lập phương", "Rewrite as (…)³ = (…)³."),
    "tech.cauchy_schwarz_engel": ("Bunhiacopxki dạng Engel", "Σ a²/b ≥ (Σ a)²/Σ b."),
}

# Machine-gradable answers for the benchmark (regex groups on the lesson's final answer; proofs have none).
GRADING = {
    "ptnk-2023-chuyen/1": [[r"-\s*1/2|-\s*\\frac\{?1\}?\{?2|-\s*0[.,]5"], [r"1/4|\\frac\{?1\}?\{?4|0[.,]25"]],
    "ptnk-2023-chuyen/3a": [[r"\b2\b"]],
    "ptnk-2023-chuyen/3b": [[r"\b4\b"], [r"\b11\b"]],
    "ptnk-2024-chuyen/1.1": [[r"\b0\b"], [r"\\sqrt\{?2|√2|frac\{?1\}?\{?\\sqrt|0[.,]70"]],
    "ptnk-2024-chuyen/3b": [[r"lẻ|odd|2k\s*\+\s*1"]],
    "ptnk-2024-chuyen/3c": [[r"4k\s*\+\s*2|8k\s*\+\s*2|n\s*≡\s*2|chia 4 dư 2"]],
    "ptnk-2025-chuyen/2b": [[r"19/4|\\frac\{?19\}?\{?4|4[.,]75"]],
    "ptnk-2025-chuyen/3b": [[r"\(\s*4\s*[,;]\s*2\s*\)|m\s*=\s*4"], [r"\(\s*1\s*[,;]\s*1\s*\)|m\s*=\s*n\s*=\s*1|m\s*=\s*1"]],
    "hcm-2025-chuyen/1a": [[r"(=|là)\s*8\b|\bP\s*=\s*8"]],
    "hcm-2025-chuyen/1b": [[r"-\s*1\b"]],
    "hcm-2025-chuyen/2a": [[r"14\s*(giờ|h|:)\s*45"]],
    "hcm-2025-chuyen/2b": [[r"1/3|\\frac\{?1\}?\{?3|0[.,]33"]],
    "hcm-2025-chuyen/5a": [[r"4/201|\\frac\{?4\}?\{?201"]],
    "hanoi-2025-chuyen/I.1": [[r"\b4\b"]],
    "hanoi-2025-chuyen/I.2": [[r"(=|là)\s*0\b"]],
    "hanoi-2025-chuyen/II.2": [[r"-\s*7\s*[,;]\s*-\s*14"], [r"-\s*2\s*[,;]\s*-\s*3"], [r"\(\s*4\s*[,;]\s*7\s*\)"]],
    "hanoi-2025-chuyen/III.1b": [[r"(=|là)\s*8\b|min.{0,20}8\b"]],
    "hanoi-2025-chuyen/V.1": [[r"không|no\b|cannot"]],
    "hanoi-2025-chuyen/V.2": [[r"\b70\b"]],
    "khtn-2025-vong2/I.1": [[r"x\s*=\s*0|\b0\b"], [r"x\s*=\s*1|\b1\b"]],
    "khtn-2025-vong2/I.2": [[r"\(\s*1\s*[,;]\s*1\s*\)|x\s*=\s*y\s*=\s*1"]],
    "khtn-2025-vong2/II.1": [[r"\(\s*1\s*[,;]\s*1\s*\)"], [r"\(\s*2\s*[,;]\s*2\s*\)"]],
    "khtn-2025-vong2/IV": [[r"\b4\b"]],
}

# PTNK 2026 chuyên = tools/benchmark ch-1…ch-5 (verified in tools/benchmark/ground_truth.py).
PTNK2026 = {
    "ch-1": dict(qid="1", topic="algebra", know=["alg.discriminant", "alg.vieta", "alg.square_sum_nonneg"], tech=["tech.subtract_equations", "tech.factor_and_case"], level="specialized_grade9", difficulty=3,
                 insight=r"Subtracting the equations: $(a-b)(2t-3)=0$, so the common root is $\frac32$; then Vi-ét.", kind="prove"),
    "ch-2": dict(qid="2", topic="geometry", know=["geo.similar_triangles", "alg.am_gm"], tech=["tech.square_completion", "tech.qm_am_bound"], level="specialized_grade9", difficulty=3,
                 insight=r"Pythagoras at the diagonals' intersection: $AB^2+CD^2=AD^2+BC^2=50$, then $(AB+CD)^2\le2(AB^2+CD^2)$.", kind="compute"),
    "ch-3": dict(qid="3", topic="number_theory", know=["nt.modular_arithmetic", "alg.factorization"], tech=["tech.factor_and_case", "tech.parity_mod", "tech.case_analysis"], level="specialized_grade9", difficulty=3,
                 insight=r"$f(n)=16(n+2)(n^2+4n+8)$; then cases mod 3, 4 and 9.", kind="compute"),
    "ch-4": dict(qid="4", topic="geometry", know=["geo.incircle_tangents", "geo.power_of_point", "geo.cyclic_quad"], tech=["tech.similar_triangles", "tech.power_of_point", "tech.angle_chasing"], level="olympiad_style", difficulty=5,
                 insight=r"$ID^2=IJ\cdot IA$ (right triangle $AIE$) gives the similar triangles; then cyclic quadrilaterals.", kind="prove"),
    "ch-5": dict(qid="5", topic="combinatorics", know=["comb.construction", "alg.system_linear", "comb.extremal"], tech=["tech.construction", "tech.double_counting"], level="specialized_grade9", difficulty=3,
                 insight="Add k to each cell of the 3×3 magic square; the centre is n/3; the nine distinct numbers sum to at least 45.", kind="prove"),
}


def sha256(path: Path):
    return hashlib.sha256(path.read_bytes()).hexdigest() if path.exists() else None


def main() -> None:
    used = defaultdict(set)
    records = []
    for item in catalog.Q:
        exam = catalog.EXAMS[item["exam"]]
        pid = f"{item['exam']}/{item['qid']}"
        text = f"{item['stem']} {item['question']}".strip() if item["stem"] else item["question"]
        records.append(dict(
            problem_id=pid, exam_id=item["exam"], question_number=item["qid"], school=exam["school"], province=exam["province"], year=exam["year"],
            topic=item["topic"], kind=item["kind"], stem=item["stem"], question=item["question"], problem_text=text, diagram=item["diagram"],
            official_answer=item["answer"] if item["answer_status"] in ("official", "teacher") else None, answer=item["answer"], answer_status=item["answer_status"],
            verification=item["verify"], source_id=exam["sources"][0]["source_id"], page=item["page"], split=catalog.SPLIT[item["exam"]],
            ocr_status="transcribed_needs_review", language="vi"))
        for k in item["knowledge"]:
            used["concept"].add(k)
        for t in item["techniques"]:
            used["technique"].add(t)

    bench = {json.loads(l)["id"]: json.loads(l) for l in (ROOT / "tools/benchmark/dataset/problems.jsonl").read_text().splitlines() if l.strip()}
    for bid, meta in PTNK2026.items():
        b = bench[bid]
        records.append(dict(
            problem_id=f"ptnk-2026-chuyen/{meta['qid']}", exam_id="ptnk-2026-chuyen", question_number=meta["qid"], school=catalog.EXAMS["ptnk-2026-chuyen"]["school"],
            province="TP. Hồ Chí Minh", year=2026, topic=meta["topic"], kind=meta["kind"], stem=None, question=b["problem_text"], problem_text=b["problem_text"], diagram=None,
            official_answer=b["ground_truth_answer"], answer=b["ground_truth_answer"], answer_status="official", verification=f"tools/benchmark/ground_truth.py:{bid}",
            source_id="ptnk-2026-chuyen-de", page=1, split="validation", ocr_status="verified_in_benchmark", language="vi", benchmark_id=bid))
        for k in meta["know"]:
            used["concept"].add(k)
        for t in meta["tech"]:
            used["technique"].add(t)

    missing = sorted((used["concept"] - CONCEPTS.keys()) | (used["technique"] - TECHNIQUES.keys()))
    if missing:
        sys.exit(f"undefined taxonomy ids: {missing}")

    # knowledge profiles
    profiles = []
    for item in catalog.Q:
        profiles.append(dict(problem_id=f"{item['exam']}/{item['qid']}", knowledge=[dict(concept=k, name=CONCEPTS[k][0], role="prerequisite", level=CONCEPTS[k][1]) for k in item["knowledge"]],
                             techniques=[dict(technique=t, name=TECHNIQUES[t][0], role="main" if i == 0 else "supporting") for i, t in enumerate(item["techniques"])],
                             key_insight=item["key_insight"], difficulty=item["difficulty"], expected_level=item["expected_level"], alternative_methods=item["alternative_methods"],
                             common_errors=item["common_errors"], annotation_status="claude_annotated_needs_teacher_review",
                             solution_verified={"official": "official_key", "teacher": "teacher_published", "derived": "derived"}[item["answer_status"]] + ("+computed" if item["verify"] else "+manual_review")))
    for bid, meta in PTNK2026.items():
        profiles.append(dict(problem_id=f"ptnk-2026-chuyen/{meta['qid']}", knowledge=[dict(concept=k, name=CONCEPTS[k][0], role="prerequisite", level=CONCEPTS[k][1]) for k in meta["know"]],
                             techniques=[dict(technique=t, name=TECHNIQUES[t][0], role="main" if i == 0 else "supporting") for i, t in enumerate(meta["tech"])],
                             key_insight=meta["insight"], difficulty=meta["difficulty"], expected_level=meta["level"], alternative_methods=[], common_errors=[],
                             annotation_status="claude_annotated_needs_teacher_review", solution_verified="official_key+computed"))

    # graph: concept → techniques → problems
    graph = dict(concepts={k: dict(name=v[0], level=v[1], prerequisites=v[2], problems=[]) for k, v in CONCEPTS.items() if k in used["concept"]},
                 techniques={k: dict(name=v[0], description=v[1], problems=[], with_concepts=Counter()) for k, v in TECHNIQUES.items() if k in used["technique"]})
    for p in profiles:
        for k in p["knowledge"]:
            graph["concepts"][k["concept"]]["problems"].append(p["problem_id"])
        for t in p["techniques"]:
            graph["techniques"][t["technique"]]["problems"].append(p["problem_id"])
            for k in p["knowledge"]:
                graph["techniques"][t["technique"]]["with_concepts"][k["concept"]] += 1

    write = lambda path, obj: (path.parent.mkdir(parents=True, exist_ok=True), path.write_text(obj if isinstance(obj, str) else json.dumps(obj, ensure_ascii=False, indent=1)))
    jsonl = lambda rows: "".join(json.dumps(r, ensure_ascii=False) + "\n" for r in rows)

    manifest = []
    for eid, exam in catalog.EXAMS.items():
        for s in exam["sources"]:
            local = ROOT / s["local_file"] if s["local_file"] else None
            manifest.append(dict(source_id=s["source_id"], exam_id=eid, school=exam["school"], province=exam["province"], year=exam["year"], exam_name=exam["exam_name"],
                                 source_url=s["url"], published_on=s["published_on"], source_type=s["source_type"], access_date=catalog.ACCESS_DATE,
                                 verification_status="downloaded" if local and local.exists() else "not_obtained", sha256=sha256(local) if local else None,
                                 license_or_usage_notes="Third-party copyright; kept locally (data/exams/raw is gitignored), cited, not redistributed. Question statements are transcribed for evaluation.",
                                 local_file=s["local_file"], notes=s["notes"]))
    write(DATA / "exam_sources.json", manifest)
    for eid, exam in catalog.EXAMS.items():
        write(DATA / "exams" / f"{eid}.json", dict(exam_id=eid, **{k: v for k, v in exam.items() if k != "sources"}, split=catalog.SPLIT[eid],
                                                   source_ids=[s["source_id"] for s in exam["sources"]], questions=[r for r in records if r["exam_id"] == eid]))
    write(DATA / "processed" / "problems.jsonl", jsonl(records))
    write(DATA / "knowledge" / "profiles.jsonl", jsonl(profiles))
    write(DATA / "knowledge" / "graph.json", graph)
    write(DATA / "techniques" / "taxonomy.json", dict(concepts={k: dict(name=v[0], level=v[1], prerequisites=v[2]) for k, v in CONCEPTS.items()},
                                                       techniques={k: dict(name=v[0], description=v[1]) for k, v in TECHNIQUES.items()}))
    by_profile = {p["problem_id"]: p for p in profiles}
    for split, folder in (("train", "training"), ("validation", "validation"), ("test", "test")):
        write(DATA / folder / "problems.jsonl", jsonl([dict(r, profile=by_profile[r["problem_id"]]) for r in records if r["split"] == split]))

    # teaching records (training targets): only training-split problems with a computed verification
    import teaching
    teach_rows = []
    for pid, t in teaching.T.items():
        rec = next((r for r in records if r["problem_id"] == pid), None)
        if rec is None or rec["split"] != "train" or not rec["verification"]:
            sys.exit(f"teaching record {pid} is not a verified training problem")
        teach_rows.append(dict(problem_id=pid, source_id=rec["source_id"], question=rec["problem_text"], problem_type=t["type"], required_knowledge=t["knowledge"],
                               key_idea=t["key_idea"], hints=t["hints"], solution=t["solution"], final_answer=t["answer"], takeaway=t["takeaway"],
                               techniques=[x["technique"] for x in by_profile[pid]["techniques"]], expected_level=by_profile[pid]["expected_level"],
                               verification=rec["verification"], author="claude", review_status="needs_teacher_review"))
    write(DATA / "training" / "teaching.jsonl", jsonl(teach_rows))

    # benchmark items (the solver's evaluation set); PTNK 2026 stays as ch-1…ch-5 in problems.jsonl
    bench_rows = []
    for r, item in ((r, i) for r, i in zip(records, catalog.Q)):
        pid = r["problem_id"]
        accept = GRADING.get(pid, [])
        bench_rows.append(dict(id=pid.replace("/", "_"), split=r["split"], topic=r["topic"], difficulty=item["difficulty"], format="proof" if item["answer"] == "proof" else r["kind"],
                               problem_text=r["problem_text"], options=None, ground_truth_answer=r["answer"], grading=dict(mcq=None, accept=accept, reject=[], proof_parts=[]),
                               expected_level=item["expected_level"], exam=r["exam_id"]))
    write(ROOT / "tools/benchmark/dataset/chuyen.jsonl", jsonl(bench_rows))

    stats = Counter((r["split"], r["topic"]) for r in records)
    print(f"{len(records)} problems from {len(catalog.EXAMS)} exams; {sum(1 for r in records if r['verification'])} with computed verification")
    for split in ("train", "validation", "test"):
        rows = [r for r in records if r["split"] == split]
        print(f"  {split:<10} {len(rows):>3}  " + ", ".join(f"{t}={n}" for (s, t), n in sorted(stats.items()) if s == split))
    print(f"teaching records (train, verified): {len(teach_rows)}")
    print(f"concepts used {len(used['concept'])}/{len(CONCEPTS)}, techniques used {len(used['technique'])}/{len(TECHNIQUES)}; benchmark items {len(bench_rows)} ({sum(1 for b in bench_rows if b['grading']['accept'])} auto-gradable)")


if __name__ == "__main__":
    main()
