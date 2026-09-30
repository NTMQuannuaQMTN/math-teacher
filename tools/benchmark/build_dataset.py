"""
Builds tools/benchmark/dataset/problems.jsonl (canonical benchmark format) and splits.json.

Sources
- PTNK 2026 Toán không chuyên + Toán chuyên (official exam papers, public Google Drive
  folder "2627 - Tuyển sinh 10 - Đề thi chính thức"), transcribed by hand from the PDFs.
  No answer keys were published there: every ground truth was derived by hand and is
  verified by computation in ground_truth.py (the `check` field names the check ids).
- tools/solver-eval/cases.json (repo cases written during development).

Splits (see DATASET.md for the rationale)
- test: the Toán KC exam. Never seen during development; run once per final system.
- validation: the Toán chuyên exam (used while developing the verifier, so it cannot be a
  test set) plus a stratified sample of repo cases.
- train: remaining repo cases (few-shot / fine-tuning examples only).
"""
import hashlib
import json
import os

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "dataset")
os.makedirs(OUT, exist_ok=True)

KC = {
    "source": "PTNK 2026 — Tuyển sinh 10 — Toán (Không chuyên), đề chính thức",
    "file": "2026 - TS10 - Toán KC (Đề thi).pdf",
    "drive_id": "1cNbv6OZSAifjHoaXgwdg1TuaUHgVGAzm",
    "sha256": "54c5797ea04172cd9012b2c8328e9279ec76124d3cb7a31e9e6a2ab0feee826b",
}
CH = {
    "source": "PTNK 2026 — Tuyển sinh 10 — Toán (Chuyên), đề chính thức",
    "file": "2026 - TS10 - Toán chuyên (Đề thi).pdf",
    "drive_id": "1VELpMNWh_RFVug6fqm023eQRT6EJhY8R",
    "sha256": "40bda29538f19aa5020e29cc4f2cbd650e13af579c22dd05d8d3d49c8af5cd08",
}


def mcq(qid, n, text, options, correct, value_patterns, topic, subtopic, difficulty, requires, solution, mistakes, check):
    body = text + "\n" + "   ".join(f"{k}. {v}" for k, v in options.items())
    return {
        "id": qid,
        **{"source": KC["source"], "source_file": KC["file"], "source_drive_id": KC["drive_id"], "source_sha256": KC["sha256"]},
        "year": 2026, "language": "vi", "exam": "PTNK-2026-KC", "question": f"Trắc nghiệm câu {n}",
        "topic": topic, "subtopic": subtopic, "difficulty": difficulty, "format": "multiple_choice",
        "requires": requires, "problem_text": f"Câu {n}. {body}", "options": options, "diagram": None,
        "ground_truth_answer": f"{correct}. {options[correct]}", "ground_truth_solution": solution,
        "grading": {"mcq": correct, "accept": [value_patterns], "reject": [], "proof_parts": []},
        "allowed_methods": ["Grade 9 Vietnamese curriculum"], "common_mistakes": mistakes, "check": check,
    }


def essay(base, qid, n, text, answer, solution, grading, topic, subtopic, difficulty, fmt, requires, mistakes, check, diagram=None):
    return {
        "id": qid, **{"source": base["source"], "source_file": base["file"], "source_drive_id": base["drive_id"], "source_sha256": base["sha256"]},
        "year": 2026, "language": "vi", "exam": "PTNK-2026-KC" if base is KC else "PTNK-2026-CHUYEN", "question": f"Câu {n}",
        "topic": topic, "subtopic": subtopic, "difficulty": difficulty, "format": fmt, "requires": requires,
        "problem_text": f"Câu {n}. {text}", "options": None, "diagram": diagram,
        "ground_truth_answer": answer, "ground_truth_solution": solution, "grading": grading,
        "allowed_methods": ["Grade 9 Vietnamese curriculum"], "common_mistakes": mistakes, "check": check,
    }


G = lambda accept=(), reject=(), proof=(): {"mcq": None, "accept": [list(a) for a in accept], "reject": list(reject), "proof_parts": list(proof)}

items = [
    mcq("kc-mcq1", 1, r"Biểu thức $\frac{3x}{\sqrt{x-3}+2}+\frac{2x^{2}}{x-5}$ xác định khi và chỉ khi:",
        {"A": r"$x \ge 3$ và $x \ne 5$", "B": r"$x > 3$ và $x \ne 5$", "C": r"$x \ge 3$", "D": r"$x > 5$"}, "A",
        [r"x\s*(≥|>=|\\ge)\s*3.{0,40}x\s*(≠|!=|\\ne)\s*5"], "algebra", "domain of expressions", 1, ["symbolic"],
        "√(x−3) cần x ≥ 3; mẫu √(x−3)+2 > 0 luôn đúng; mẫu x − 5 ≠ 0.", ["forgetting x ≠ 5", "writing x > 3"], "kc-mcq1"),
    mcq("kc-mcq2", 2, r"Trong mặt phẳng tọa độ $Oxy$, đường thẳng $d: y=2x+1$ và đường parabol $P: y=x^{2}-2$ cắt nhau tại hai điểm phân biệt có tọa độ là $(x_{1}; y_{1})$ và $(x_{2}; y_{2})$. Giá trị của $x_{1}+x_{2}-x_{1}x_{2}$ là:",
        {"A": "3", "B": "4", "C": "5", "D": "6"}, "C", [r"(=|là)\s*5(?![0-9])"], "algebra", "parabola-line intersection, Vieta", 1, ["symbolic"],
        "Hoành độ giao điểm: x² − 2x − 3 = 0 ⇒ x₁ + x₂ = 2, x₁x₂ = −3 ⇒ 2 − (−3) = 5.", ["sign error on x1x2"], "kc-mcq2"),
    mcq("kc-mcq3", 3, r"Các đoạn thẳng $BF$ và $CE$ cắt nhau tại $A$. Biết $AB = BC$, $AE = AF$ và $\widehat{AEF} = 50^{\circ}$. Gọi $H$ là trực tâm của tam giác $ABC$. Góc $\widehat{AHC}$ bằng:",
        {"A": r"$100^{\circ}$", "B": r"$120^{\circ}$", "C": r"$140^{\circ}$", "D": r"$160^{\circ}$"}, "D", [r"160"], "geometry", "angles, orthocenter", 2, ["geometry_construction", "diagram"],
        "∠EAF = 80° = ∠BAC (đối đỉnh); AB = BC ⇒ ∠BCA = 80°, ∠ABC = 20°; ∠AHC = 180° − ∠ABC = 160°.", ["confusing vertical angles", "∠AHC = 180° − ∠A"], "kc-mcq3"),
    mcq("kc-mcq4", 4, r"Biết phương trình $x + \frac{2}{x} = 4$ có hai nghiệm phân biệt $x_{1}, x_{2}$. Giá trị của $\frac{x_{1}}{x_{2}} + \frac{x_{2}}{x_{1}}$ là:",
        {"A": "2", "B": "4", "C": "6", "D": "8"}, "C", [r"(=|là)\s*6(?![0-9])"], "algebra", "Vieta", 1, ["symbolic"],
        "x² − 4x + 2 = 0 ⇒ S = 4, P = 2 ⇒ (S² − 2P)/P = 12/2 = 6.", ["using S²/P"], "kc-mcq4"),
    mcq("kc-mcq5", 5, r"Cho $AB, AC$ là các tiếp tuyến của đường tròn $(O)$ với $B, C$ là các tiếp điểm. Biết $OA = 2$ và bán kính đường tròn $(O)$ bằng $1$. Độ dài $BC$ là:",
        {"A": r"$\frac{3}{2}$", "B": r"$\frac{3}{\sqrt{2}}$", "C": r"$\sqrt{3}$", "D": "2"}, "C", [r"√\s*3|sqrt\(?3|\\sqrt\{?3"], "geometry", "tangents", 2, ["geometry_construction"],
        "AB = √(OA² − R²) = √3; BC = 2·AB·OB/OA = √3.", ["taking BC = AB"], "kc-mcq5"),
    mcq("kc-mcq6", 6, r"Trong mặt phẳng tọa độ $Oxy$, hai đường thẳng phân biệt $d_{1}: y=(9-m^{2})x+5$ và $d_{2}: y=5x+m+7$ song song với nhau khi và chỉ khi giá trị của $m$ là:",
        {"A": r"$m=2$ hoặc $m=-2$", "B": r"$m=2$", "C": r"$m=-2$", "D": "Không có giá trị thỏa mãn"}, "B", [r"m\s*=\s*2(?![0-9])"], "algebra", "parallel lines", 1, ["symbolic"],
        "9 − m² = 5 ⇒ m = ±2; cần 5 ≠ m + 7 ⇒ m ≠ −2 ⇒ m = 2.", ["keeping m = −2 (lines coincide)"], "kc-mcq6"),
    mcq("kc-mcq7", 7, r"Cho các số thực $a, b, c, d, e$ thỏa mãn: $a+b+2=b+c-1=c+d+3=d+e-2=e+a+1$. Số lớn nhất trong các số đã cho là:",
        {"A": "b", "B": "c", "C": "d", "D": "e"}, "D", [r"(số lớn nhất|lớn nhất)[^.]{0,30}\be\b|\be\s*(là|la)\s*(số\s*)?lớn nhất"], "algebra", "linear system reasoning", 2, ["symbolic"],
        "Gọi giá trị chung là k: a = S − 2k − 3, b = S − 2k + 4, c = d = S − 2k, e = S − 2k + 5 ⇒ e lớn nhất.", ["comparing only neighbouring pairs"], "kc-mcq7"),
    mcq("kc-mcq8", 8, r"Cho phương trình $x^{2}-2mx-3m^{2}+4m-1=0$. Số giá trị của tham số $m$ để phương trình có đúng một nghiệm là:",
        {"A": "1 giá trị", "B": "2 giá trị", "C": "3 giá trị", "D": "Không có giá trị thỏa mãn"}, "A", [r"(một|1)\s*giá trị|m\s*=\s*(1/2|0[.,]5)"], "algebra", "discriminant", 2, ["symbolic"],
        "Δ' = 4m² − 4m + 1 = (2m − 1)² = 0 ⇔ m = 1/2: đúng 1 giá trị.", ["treating 'exactly one root' as Δ ≥ 0"], "kc-mcq8"),
    mcq("kc-mcq9", 9, r"Cho tứ giác $ABCD$ có $\widehat{DAB}=\widehat{ABC}=90^{\circ}$, $\widehat{BCD}=45^{\circ}$ và $AB = AD = 1$. Gọi $M, N$ tương ứng là trung điểm $AB, CD$. Độ dài của $MN$ là:",
        {"A": r"$\sqrt{2}$", "B": r"$\frac{3}{2}$", "C": "1", "D": r"$\sqrt{3}$"}, "B", [r"3/2|1[.,]5|\\frac\{?3\}?\{?2"], "geometry", "right trapezoid, midline", 2, ["geometry_construction"],
        "BC = AD + AB·cot45° = 2; ABCD là hình thang vuông, MN là đường trung bình: (AD + BC)/2 = 3/2.", ["assuming a square"], "kc-mcq9"),
    mcq("kc-mcq10", 10, "Trong một năm nọ, người ta nhận thấy tháng 8 có đúng 4 ngày thứ tư và 4 ngày chủ nhật. Hỏi ngày 31 tháng 8 là thứ mấy?",
        {"A": "Thứ tư", "B": "Thứ năm", "C": "Thứ sáu", "D": "Thứ bảy"}, "D", [r"thứ\s*bảy|thứ\s*7|saturday"], "other", "calendar reasoning", 2, ["numeric"],
        "31 ngày = 4 tuần + 3 ngày; 3 thứ xuất hiện 5 lần là 3 ngày liên tiếp không chứa thứ Tư, Chủ nhật ⇒ Năm, Sáu, Bảy ⇒ 1/8 là thứ Năm, 31/8 là thứ Bảy.", ["counting 30-day month"], "kc-mcq10"),
    essay(KC, "kc-1", 1, "a) Chứng minh rằng $\\sqrt{4-2\\sqrt{3}}=\\frac{2}{\\sqrt{3}+1}$.\nb) Chứng minh rằng $\\sqrt{3+\\sqrt{7+4\\sqrt{3}}+\\sqrt{4-2\\sqrt{3}}}=\\frac{2}{\\sqrt{3}-1}$.",
          "a) Cả hai vế bằng √3 − 1. b) Cả hai vế bằng √3 + 1.", "4 − 2√3 = (√3 − 1)²; 7 + 4√3 = (2 + √3)²; 3 + (2 + √3) + (√3 − 1) = 4 + 2√3 = (√3 + 1)²; 2/(√3 ± 1) = √3 ∓ 1.",
          G(proof=["a", "b"]), "algebra", "radicals", 1, "proof", ["symbolic"], ["dropping absolute value in √((√3−1)²)"], ["kc-1a", "kc-1b"]),
    essay(KC, "kc-2", 2, "Cho các phương trình: $x^{2}-mx+1=0$ (1) và $x^{2}-x+m=0$ (2), trong đó $m$ là tham số.\na) Tìm $m$ để phương trình (1) vô nghiệm và phương trình (2) có hai nghiệm phân biệt.\nb) Tìm $m$ để cả hai phương trình đều có hai nghiệm phân biệt và tổng bình phương của hai nghiệm bằng nhau.",
          "a) −2 < m < 1/4. b) m = −3.", "a) m² − 4 < 0 và 1 − 4m > 0. b) m² > 4 và m < 1/4 ⇒ m < −2; m² − 2 = 1 − 2m ⇒ m = 1 hoặc m = −3; chọn m = −3.",
          G(accept=[[r"-\s*2\s*<\s*m\s*<\s*(1/4|0[.,]25|\\frac\{?1\}?\{?4)|\(\s*-\s*2\s*;\s*(1/4|0[.,]25)\s*\)"], [r"m\s*=\s*-\s*3"]]), "algebra", "discriminant, Vieta", 2, "multi_part", ["symbolic"],
          ["keeping m = 1", "forgetting the distinct-roots condition"], ["kc-2a", "kc-2b"]),
    essay(KC, "kc-3", 3, "Cho hình bình hành $ABCD$ có $I$ là giao điểm của các đường chéo $AC$ và $BD$. Gọi $K$ là một điểm trên cạnh $AB$. Lấy các điểm $M$ trên cạnh $AD$ và $N$ trên cạnh $BC$ sao cho $KM$ song song với $BD$ và $KN$ song song với $AC$.\na) Chứng minh rằng $I$ là trung điểm của $MN$.\nb) Tìm tỉ số $\\frac{AK}{AB}$ sao cho diện tích tam giác $KMN$ bằng $\\frac{2}{9}$ diện tích hình bình hành $ABCD$.",
          "a) (chứng minh) b) AK/AB = 1/3 hoặc AK/AB = 2/3.", "Đặt AK/AB = t: AM/AD = t, BN/BC = 1 − t; S(KMN) = t(1 − t)·S(ABCD) = 2/9·S ⇒ t = 1/3 hoặc 2/3.",
          G(accept=[[r"1/3|\\frac\{?1\}?\{?3"], [r"2/3|\\frac\{?2\}?\{?3"]], proof=["a"]), "geometry", "parallelogram, Thales, area", 3, "multi_part", ["geometry_construction", "symbolic"],
          ["giving only one of the two ratios"], ["kc-3a", "kc-3b"]),
    essay(KC, "kc-4", 4, "Trường X tổ chức một trại hè quốc tế, trong đó bao gồm một số học sinh Việt Nam và một số học sinh nước ngoài tham gia. Ban tổ chức muốn ghép cặp một số học sinh để giao lưu văn hóa, mỗi cặp gồm đúng 1 học sinh Việt Nam và 1 học sinh nước ngoài, và mỗi học sinh chỉ được tham gia tối đa một cặp. Ngày đầu tiên có đúng $\\frac{1}{2}$ số học sinh Việt Nam và $\\frac{2}{3}$ số học sinh nước ngoài được ghép cặp thành công.\na) Tính tỉ lệ tổng số học sinh được ghép cặp trên tổng số học sinh tham gia trại hè sau ngày đầu.\nb) Ngày thứ hai có thêm 6 học sinh nữa được ghép thành 3 cặp mới. Khi đó, tỉ lệ tổng số học sinh được ghép cặp trên tổng số học sinh tham gia trại hè bằng $\\frac{5}{7}$. Tìm số học sinh Việt Nam và số học sinh nước ngoài tham gia trại hè ban đầu.",
          "a) 4/7. b) 24 học sinh Việt Nam, 18 học sinh nước ngoài.", "V/2 = 2F/3 ⇒ V = 4F/3; tỉ lệ = V/(V + F) = 4/7; (V + 6)/(7V/4) = 5/7 ⇒ V = 24, F = 18.",
          G(accept=[[r"4/7|\\frac\{?4\}?\{?7"], [r"24"], [r"18"]]), "word_problem", "ratios, linear equations", 2, "multi_part", ["symbolic"],
          ["counting pairs instead of students"], ["kc-4a", "kc-4b"]),
    essay(KC, "kc-5", 5, "Cho tam giác $ABC$ nhọn ($AB < AC$) có $H$ là trực tâm, $E, F$ lần lượt là chân các đường cao kẻ từ $B, C$. Gọi $I, J$ tương ứng là trung điểm của $BC, AH$; gọi $R, S$ tương ứng là giao điểm của $EF$ với $AH, BC$.\na) Chứng minh rằng $IE = IF = \\frac{BC}{2}$ và $JE = JF = \\frac{AH}{2}$.\nb) Chứng minh rằng tứ giác $IEJF$ nội tiếp và $R$ là trực tâm của tam giác $SIJ$.\nc) Gọi $(J)$ là đường tròn đường kính $AH$. Đường thẳng $IR$ cắt $(J)$ tại $M$ và $N$. Chứng minh rằng $IM \\cdot IN = \\frac{BC^{2}}{4}$ và $SM, SN$ tiếp xúc với $(J)$.",
          "(chứng minh ba phần)", "a) trung tuyến ứng với cạnh huyền; b) IE, IF tiếp xúc (J) ⇒ ∠JEI = ∠JFI = 90°; IJ ⊥ EF, SR ⊥ IJ... ; c) phương tích của I với (J): IM·IN = IE² = BC²/4.",
          G(proof=["a", "b", "c"]), "geometry", "orthocenter, nine-point circle, power of a point", 4, "proof", ["geometry_construction", "diagram"],
          ["asserting cyclicity without angle argument"], ["kc-5a", "kc-5b", "kc-5c"]),
    essay(CH, "ch-1", 1, "Cho các phương trình $x^{2}+2ax+3b=0$ và $x^{2}+2bx+3a=0$, trong đó $a$ và $b$ là hai tham số. Biết các phương trình này đều có hai nghiệm phân biệt.\na) Chứng minh $\\left(a-\\frac{3}{2}\\right)^{2}+\\left(b-\\frac{3}{2}\\right)^{2}>\\frac{9}{2}$.\nb) Giả sử hai phương trình trên có đúng một nghiệm chung. Gọi $r$ là nghiệm còn lại của phương trình thứ nhất và $s$ là nghiệm còn lại của phương trình thứ hai. Chứng minh $r+s$ không phụ thuộc vào $a$ và $b$.",
          "a) (chứng minh) b) r + s = −3/2.", "a) a² > 3b, b² > 3a, cộng lại. b) Trừ hai phương trình: (a − b)(2x₀ − 3) = 0 ⇒ x₀ = 3/2 ⇒ a + b = −3/4; r = 2b, s = 2a ⇒ r + s = −3/2.",
          G(accept=[[r"-\s*3/2|-\s*1[.,]5|-\s*\\frac\{?3\}?\{?2"]], reject=[r"r\s*\+\s*s\s*=\s*3(?![/0-9])"], proof=["a"]), "algebra", "discriminant, common root, Vieta", 3, "multi_part", ["symbolic"],
          ["r + s = 3", "forgetting a ≠ b"], ["ch-1a", "ch-1b"]),
    essay(CH, "ch-2", 2, "Cho tứ giác lồi $ABCD$ có các cạnh $BC = 7$, $DA = 1$, và hai đường chéo $AC$ và $BD$ vuông góc với nhau. Tìm giá trị lớn nhất của chu vi tứ giác $ABCD$.",
          "18", "AB² + CD² = BC² + DA² = 50 ⇒ AB + CD ≤ √(2·50) = 10 ⇒ P ≤ 18, đạt khi AB = CD = 5.",
          G(accept=[[r"(=|là|bằng)\s*18(?![0-9])"]]), "geometry", "perpendicular diagonals, inequality", 3, "calculation", ["geometry_construction", "symbolic"],
          ["not showing the maximum is attained"], ["ch-2"]),
    essay(CH, "ch-3", 3, "Với mỗi số nguyên dương $n$, đặt $f(n)=(n+4)^{4}-n^{4}$.\na) Chứng minh $f(n)$ chia hết cho $16$ với mọi $n$.\nb) Tìm $n$ để $f(n)$ chia hết cho $3$.\nc) Tìm $n$ để $f(n)$ chia hết cho $24^{2}$.",
          "a) (chứng minh) b) n chia 3 dư 1 (n = 3k + 1). c) n chia 18 dư 16 (n = 18k + 16).", "f(n) = 16(n + 2)((n + 2)² + 4); b) 3 ∤ (m² + 4) nên cần 3 | n + 2; c) cần 36 | (n + 2)((n + 2)² + 4) ⇒ 18 | n + 2.",
          G(accept=[[r"3k\s*\+\s*1|≡\s*1\s*\(?\s*mod\s*3|dư\s*1|n\s*%\s*3\s*=\s*1"], [r"18k\s*\+\s*16|18k\s*-\s*2|≡\s*16|≡\s*-\s*2\s*\(?\s*mod\s*18|dư\s*16|n\s*%\s*18\s*=\s*16"]],
            reject=[r"không (có|tồn tại) (số|giá trị)", r"n\s*(≠|\\neq|\\ne)\s*3k"], proof=["a"]), "number_theory", "divisibility", 3, "multi_part", ["symbolic", "numeric"],
          ["n not divisible by 3", "claiming no n works for 24²"], ["ch-3a", "ch-3b", "ch-3c"]),
    essay(CH, "ch-4", 4, "Cho tam giác $ABC$ nhọn ($AB < AC$) có đường tròn nội tiếp $(I)$ tiếp xúc với các cạnh $BC, CA, AB$ lần lượt tại $D, E, F$. Gọi $J$ là trung điểm của $EF$ và $K$ là giao điểm của $AD$ với $EF$.\na) Chứng minh $ID^{2} = IJ \\cdot IA$ và tam giác $IJD$ đồng dạng với tam giác $IDA$.\nb) Gọi $H$ là giao điểm khác $I$ của $IK$ với đường tròn đường kính $AI$. Chứng minh $\\widehat{IHD} = \\widehat{IDK}$ và các điểm $I, D, J, H$ cùng thuộc một đường tròn $(S)$.\nc) Gọi $L$ và $G$ lần lượt là các giao điểm khác $D$ của $DJ$ và $(S)$ với $(I)$. Chứng minh $A, G, D$ thẳng hàng và các đường thẳng $AL, GJ$ cắt nhau trên $(I)$.",
          "(chứng minh ba phần)", "a) hệ thức lượng trong tam giác vuông AEI; b) ID² = IH·IK ⇒ △IHD ∽ △IDK; c) IG = ID, △IJG ∽ △IGA, phương tích.",
          G(proof=["a", "b", "c"]), "geometry", "incircle, similarity, cyclic quadrilaterals", 4, "proof", ["geometry_construction", "diagram"],
          ["IH ⊥ IK", "J trùng K", "∠IDK = ∠IAD"], ["ch-4a", "ch-4b", "ch-4c"]),
    essay(CH, "ch-5", 5, "Cho bảng ô vuông kích thước $3 \\times 3$ gồm 3 hàng, 3 cột và 2 đường chéo. Một số nguyên dương $n$ được gọi là số tốt nếu ta tìm được 9 số nguyên dương phân biệt và điền vào các ô của bảng, mỗi ô một số, sao cho tổng các số trên mỗi hàng, mỗi cột và mỗi đường chéo đều bằng $n$.\na) Hãy chỉ ra một cách điền các số nguyên dương từ 1 đến 9 vào các ô của bảng sao cho tổng các số trên mỗi hàng, mỗi cột và mỗi đường chéo đều bằng nhau.\nb) Chứng minh nếu $n \\ge 15$ và $n$ chia hết cho 3 thì $n$ là số tốt.\nc) Chứng minh nếu $n$ là số tốt thì $n \\ge 15$ và $n$ chia hết cho 3.",
          "a) ví dụ 2 7 6 / 9 5 1 / 4 3 8. b), c) (chứng minh)", "b) Cộng k vào mỗi ô của hình vuông 1..9 (n = 15 + 3k). c) Ô giữa bằng n/3; 9 số phân biệt ≥ 1 có tổng 3n ≥ 45.",
          G(proof=["a", "b", "c"]), "combinatorics", "magic squares", 4, "proof", ["symbolic"], ["assuming the centre is 5"], ["ch-5a", "ch-5bc"],
          diagram="A 3×3 grid of empty squares (rows, columns, two diagonals)."),
]

# Repo cases (tools/solver-eval/cases.json), mapped into the same schema.
REPO_META = {
    "a1": ("algebra", 1, "calculation"), "a2": ("algebra", 1, "calculation"), "a3": ("algebra", 2, "calculation"),
    "a4": ("algebra", 1, "calculation"), "a5": ("algebra", 1, "calculation"), "a6": ("algebra", 1, "calculation"),
    "a7": ("algebra", 2, "calculation"), "g1": ("geometry", 1, "calculation"), "g2": ("geometry", 1, "calculation"),
    "g3": ("geometry", 1, "calculation"), "g4": ("geometry", 1, "proof"), "g5": ("geometry", 1, "calculation"),
    "g6": ("geometry", 1, "calculation"), "g7": ("geometry", 1, "calculation"), "g8": ("geometry", 2, "proof"),
    "g9": ("geometry", 2, "proof"), "w1": ("word_problem", 1, "calculation"), "x1": ("invalid", 1, "ambiguous"),
    "x2": ("invalid", 1, "out_of_curriculum"), "x3": ("adversarial", 1, "calculation"),
}
cases = json.load(open(os.path.join(ROOT, "..", "solver-eval", "cases.json"), encoding="utf-8"))
for c in cases:
    short = c["id"].split("-")[0]
    if short not in REPO_META:
        continue  # r1–r4 are the Toán chuyên questions, already included above from the source PDF
    topic, difficulty, fmt = REPO_META[short]
    expect = c.get("expect") or []
    items.append({
        "id": short, "source": "repo: tools/solver-eval/cases.json (written during development)", "source_file": None,
        "source_drive_id": None, "source_sha256": None, "year": None, "language": "en" if c["id"].endswith("-en") else "vi",
        "exam": None, "question": c["id"], "topic": topic, "subtopic": c["category"], "difficulty": difficulty, "format": fmt,
        "requires": ["geometry_construction"] if topic == "geometry" else ["symbolic"], "problem_text": c["text"], "options": None,
        "diagram": None, "ground_truth_answer": " ; ".join(expect) if expect else (c.get("expectStatus") or "(proof)"),
        "ground_truth_solution": None, "expect_status": c.get("expectStatus"),
        "grading": {"mcq": None, "accept": [[p] for p in expect], "reject": c.get("reject", []), "proof_parts": [] if expect else (["all"] if fmt == "proof" else []), "literal": True},
        "allowed_methods": ["Grade 9 Vietnamese curriculum"], "common_mistakes": [], "check": [short] if short not in ("g4", "g8", "g9", "x1", "x2") else [],
    })

SPLIT = {
    "test": [i["id"] for i in items if i["id"].startswith("kc-")],
    "validation": ["ch-1", "ch-2", "ch-3", "ch-4", "ch-5", "a3", "a7", "g5", "g8", "w1", "x3"],
}
SPLIT["train"] = [i["id"] for i in items if i["id"] not in SPLIT["test"] + SPLIT["validation"]]
for i in items:
    i["split"] = next(s for s, ids in SPLIT.items() if i["id"] in ids)

with open(os.path.join(OUT, "problems.jsonl"), "w", encoding="utf-8") as fh:
    for i in items:
        fh.write(json.dumps(i, ensure_ascii=False) + "\n")
json.dump(SPLIT, open(os.path.join(OUT, "splits.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
digest = hashlib.sha256(open(os.path.join(OUT, "problems.jsonl"), "rb").read()).hexdigest()[:12]
print(f"{len(items)} problems (dataset v1, sha256 {digest}):", {s: len(v) for s, v in SPLIT.items()})
