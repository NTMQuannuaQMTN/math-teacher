"""
Source of truth for the Toán chuyên vào 10 exam dataset (dataset "chuyen-v1").

Every question was transcribed by Claude (2026-10-01) from the page images rendered from the source PDFs
listed in EXAMS (data/exams/raw, not redistributed). Transcriptions are marked ocr_status="transcribed_needs_review"
until a person proofreads them against the page image. Answers are either the source's answer (official /
teacher-published) or, where the source has none, an answer derived and checked by tools/exams/verify_exams.py.
Knowledge annotations (prerequisites, techniques, key insight, difficulty, level) are written by Claude and
need a teacher's review (annotation_status="claude_annotated").

build_dataset.py turns this file into data/exams/*.json, data/processed/problems.jsonl, data/knowledge/,
data/techniques/ and the train/validation/test files.
"""

ACCESS_DATE = "2026-10-01"

EXAMS = {
    "ptnk-2023-chuyen": dict(
        school="Trường Phổ thông Năng khiếu, ĐHQG-HCM", province="TP. Hồ Chí Minh", year=2023, exam_name="Tuyển sinh lớp 10 năm học 2023–2024, môn Toán chuyên",
        duration_min=120,
        sources=[
            dict(source_id="ptnk-2023-chuyen-de", source_type="official_exam_paper", url="https://ptnk.edu.vn/wp-content/uploads/2023/06/De-thi-Toan-chuyen-2023-2024.pdf",
                 published_on="https://ptnk.edu.vn/ky-thi-tuyen-sinh-lop-10-nam-hoc-2023-2024-de-thi-cac-mon-chuyen/", local_file="data/exams/raw/ptnk2023-De-thi-Toan-chuyen-2023-2024.pdf", notes="Scanned PDF, no text layer."),
            dict(source_id="ptnk-2023-chuyen-dapan", source_type="official_answer_key", url="https://ptnk.edu.vn/wp-content/uploads/2023/06/Dapan-Toan-Chuyen-2023-2024.pdf",
                 published_on="https://ptnk.edu.vn/ky-thi-tuyen-sinh-10-nam-hoc-2023-2024-dap-an-cac-mon-chuyen/", local_file="data/exams/raw/ptnk2023-Dapan-Toan-Chuyen-2023-2024.pdf", notes="Text layer garbles formulas; read from rendered pages."),
        ]),
    "ptnk-2024-chuyen": dict(
        school="Trường Phổ thông Năng khiếu, ĐHQG-HCM", province="TP. Hồ Chí Minh", year=2024, exam_name="Tuyển sinh lớp 10 năm học 2024–2025, môn Toán chuyên",
        duration_min=150,
        sources=[
            dict(source_id="ptnk-2024-chuyen-de", source_type="official_exam_paper", url="https://drive.google.com/file/d/1Pm9VW2WJbfwe2GK5-vEKviXSjQcgA7r_/view",
                 published_on="https://ptnk.edu.vn/cong-bo-de-thi-chinh-thuc-tuyen-sinh-lop-10-nam-hoc-2024-2025/", local_file="data/exams/raw/ptnk2024-toan-chuyen-de.pdf", notes="Scan with a poor OCR text layer."),
            dict(source_id="ptnk-2024-chuyen-dapan", source_type="official_answer_key", url="https://drive.google.com/file/d/1LBbnLhPQ3kOQhjKuc-uyDVE3eGqJHC9K/view",
                 published_on="https://ptnk.edu.vn/dap-an-huong-dan-cham-cac-mon-thi-ky-thi-tuyen-sinh-lop-10-nam-hoc-2024-2025/", local_file="data/exams/raw/ptnk2024-toan-chuyen-dap-an.pdf", notes=""),
        ]),
    "ptnk-2025-chuyen": dict(
        school="Trường Phổ thông Năng khiếu, ĐHQG-HCM", province="TP. Hồ Chí Minh", year=2025, exam_name="Kỳ thi tuyển sinh lớp 10 năm 2025, môn Toán (Chuyên)",
        duration_min=150,
        sources=[
            dict(source_id="ptnk-2025-chuyen-de", source_type="official_exam_paper", url="https://drive.google.com/file/d/1j2_Bb6m8KnajB6soNs3Lr-wWe7NIN2RS/view",
                 published_on="https://ptnk.edu.vn/de-thi-chinh-thuc-ky-thi-tuyen-sinh-lop-10-nam-2025/", local_file="data/exams/raw/ptnk2025-toan-chuyen-de.pdf", notes="Scanned PDF."),
            dict(source_id="ptnk-2025-chuyen-dapan", source_type="official_answer_key", url="https://drive.google.com/file/d/1xH8_E-fAM_qa_KQafC9uMg3Zs0GsmwVD/view",
                 published_on="https://ptnk.edu.vn/dap-an-cac-de-thi-ky-thi-tuyen-sinh-lop-10-nam-2025/", local_file=None,
                 notes="NOT OBTAINED: the Drive owner disabled downloads ('the owner hasn't given you permission to download'). Not bypassed. Answers derived and verified by computation instead."),
        ]),
    "ptnk-2026-chuyen": dict(
        school="Trường Phổ thông Năng khiếu, ĐHQG-HCM", province="TP. Hồ Chí Minh", year=2026, exam_name="Kỳ thi tuyển sinh lớp 10 năm 2026, môn Toán chuyên",
        duration_min=150,
        sources=[
            dict(source_id="ptnk-2026-chuyen-de", source_type="official_exam_paper", url="https://drive.google.com/file/d/1VELpMNWh_RFVug6fqm023eQRT6EJhY8R/view",
                 published_on="https://ptnk.edu.vn/de-thi-chinh-thuc-ky-thi-tuyen-sinh-vao-lop-10-nam-2026-cua-truong-ptnk/", local_file="data/exams/raw/ptnk2026-toan-chuyen-de.pdf", notes="Questions already in tools/benchmark (ch-1 … ch-5)."),
            dict(source_id="ptnk-2026-chuyen-hdg", source_type="third_party_solution", url="https://cdn.thuvienphapluat.vn/uploads/Hoidapphapluat/2026/LNMK/THANG5/23/toann.pdf",
                 published_on="thuvienphapluat.vn", local_file="data/exams/raw/ptnk2026-toan-chuyen-hdg-thuvienphapluat.pdf", notes="'Đề thi và hướng dẫn giải' — author not stated; answers agree with the independently verified ground truth."),
        ]),
    "hcm-2025-chuyen": dict(
        school="Sở GD&ĐT TP. Hồ Chí Minh (chung cho các lớp chuyên Toán: Lê Hồng Phong, Trần Đại Nghĩa, …)", province="TP. Hồ Chí Minh", year=2025,
        exam_name="Kỳ thi tuyển sinh lớp 10 THPT năm học 2025–2026, môn thi chuyên Toán (07/6/2025)", duration_min=150,
        sources=[
            dict(source_id="hcm-2025-chuyen-de-hdc", source_type="exam_paper_with_marking_guide", url="https://thcs.toanmath.com/thcs-pdf/de-tuyen-sinh-lop-10-mon-toan-chuyen-nam-2025-2026-so-gddt-tp-ho-chi-minh.pdf",
                 published_on="https://thcs.toanmath.com/2025/09/de-tuyen-sinh-lop-10-mon-toan-chuyen-nam-2025-2026-so-gddt-tp-ho-chi-minh.html", local_file="data/exams/raw/hcm2025-de-tuyen-sinh-lop-10-mon-toan-chuyen-nam-2025-2026-so-gddt-tp-ho-chi-minh.pdf",
                 notes="Paper + 'Đáp án và hướng dẫn chấm' (attributed to the Sở; obtained via toanmath and a GitHub mirror, not from the Sở's site)."),
            dict(source_id="hcm-2025-chuyen-giai", source_type="third_party_solution", url="https://github.com/trietptm/De-Thi-Toan-Chuyen-Tuyen-Sinh-Lop-10-Chuyen-Toan-Trung-Hoc-Pho-Thong-TP.HCM/blob/main/Dap_An/202x/Tp_Ho_Chi_Minh_vong_2_nam_2025.pdf",
                 published_on="GitHub trietptm (no licence)", local_file="data/exams/raw/hcm2025-Tp_Ho_Chi_Minh_vong_2_nam_2025.pdf", notes=""),
        ]),
    "hanoi-2025-chuyen": dict(
        school="Sở GD&ĐT Hà Nội (chuyên Toán: THPT chuyên Hà Nội – Amsterdam, Chu Văn An, Nguyễn Huệ, Sơn Tây)", province="Hà Nội", year=2025,
        exam_name="Kỳ thi tuyển sinh vào lớp 10 THPT năm học 2025–2026, môn Toán (Chuyên Toán), 09/6/2025", duration_min=150,
        sources=[
            dict(source_id="hanoi-2025-chuyen-de-giai", source_type="exam_paper_with_teacher_solution", url="https://thcs.toanmath.com/thcs-pdf/de-tuyen-sinh-lop-10-mon-toan-chuyen-nam-2025-2026-so-gddt-ha-noi.pdf",
                 published_on="https://thcs.toanmath.com/2025/06/de-tuyen-sinh-lop-10-mon-toan-chuyen-nam-2025-2026-so-gddt-ha-noi.html", local_file="data/exams/raw/tm-de-tuyen-sinh-lop-10-mon-toan-chuyen-nam-2025-2026-so-gddt-ha-noi.pdf",
                 notes="Pages 1–6: chuyên Toán paper + solution by CLB Toán Cơ Sở (named teachers). Pages 7–12: chuyên Tin (not used)."),
        ]),
    "khtn-2025-vong2": dict(
        school="Trường THPT chuyên Khoa học Tự nhiên, ĐHQG Hà Nội", province="Hà Nội", year=2025, exam_name="Đề thi tuyển sinh vào lớp 10 năm 2025, môn Toán (vòng 2)",
        duration_min=150,
        sources=[
            dict(source_id="khtn-2025-vong2-de-giai", source_type="exam_paper_with_teacher_solution", url="https://thcs.toanmath.com/thcs-pdf/de-tuyen-sinh-lop-10-mon-toan-vong-2-nam-2025-truong-chuyen-khtn-ha-noi.pdf",
                 published_on="https://thcs.toanmath.com/2025/06/de-tuyen-sinh-lop-10-mon-toan-vong-2-nam-2025-truong-chuyen-khtn-ha-noi.html", local_file="data/exams/raw/tm-de-tuyen-sinh-lop-10-mon-toan-vong-2-nam-2025-truong-chuyen-khtn-ha-noi.pdf",
                 notes="Scanned; solution by 'Lớp toán thầy Khánh chuyên Sư Phạm'."),
        ]),
}

# Splits are by exam (source-level separation): no question, sub-part or solution of a test exam appears in train or validation.
SPLIT = {
    "ptnk-2023-chuyen": "train",
    "ptnk-2024-chuyen": "train",
    "ptnk-2025-chuyen": "train",
    "ptnk-2026-chuyen": "validation",  # = tools/benchmark ch-1…ch-5 (validation there too)
    "hcm-2025-chuyen": "validation",
    "hanoi-2025-chuyen": "test",  # unseen region and exam board
    "khtn-2025-vong2": "test",
}

# Question records. q: Vietnamese statement (LaTeX in $…$), shared stem in "stem" for sub-questions.
# answer_status: official | teacher | derived (no source answer) ; answer: short final answer or "proof".
# verify: id of the computation in verify_exams.py that checks the answer (None = proof, manual review).
# know: prerequisite concept ids; tech: technique ids (data/techniques/taxonomy.json); level: standard_grade9 |
# specialized_grade9 | olympiad_style; difficulty 1–5 (reasoning demand); insight: the key observation.
Q = []


def q(exam, qid, topic, text, answer, answer_status, verify, know, tech, level, difficulty, insight, kind, stem=None, page=1, alt=None, errors=None, diagram=None):
    Q.append(dict(exam=exam, qid=qid, topic=topic, question=text, stem=stem, answer=answer, answer_status=answer_status, verify=verify,
                  knowledge=know, techniques=tech, expected_level=level, difficulty=difficulty, key_insight=insight, kind=kind, page=page,
                  alternative_methods=alt or [], common_errors=errors or [], diagram=diagram))


# ---------------------------------------------------------------- PTNK 2023
E = "ptnk-2023-chuyen"
q(E, "1", "algebra", r"Giải hệ phương trình $\begin{cases}(x+y)\left(4+\frac{1}{xy}\right)=1\\ \left(4x+\frac{1}{x}\right)\left(4y+\frac{1}{y}\right)=-20\end{cases}$.",
  r"$(x,y)\in\{(1,-\tfrac12),(\tfrac14,-\tfrac12),(-\tfrac12,1),(-\tfrac12,\tfrac14)\}$", "official", "ptnk2023_1",
  ["alg.system_nonlinear", "alg.vieta", "alg.rational_expressions"], ["tech.change_of_variables", "tech.sum_product_system"], "specialized_grade9", 2,
  r"$(x+y)(4+\frac1{xy}) = (4x+\frac1x)+(4y+\frac1y)$, so with $u=4x+\frac1x$, $v=4y+\frac1y$ the system is $u+v=1$, $uv=-20$.", "solve",
  errors=["forgetting $x,y\\ne0$", "solving $4x+1/x=5$ as a linear equation"])
q(E, "2a", "algebra", r"Chứng minh $\frac{1}{\sqrt a}+\frac{1}{\sqrt b}+\frac{1}{\sqrt c}\le\sqrt3$.", "proof", "official", "ptnk2023_2",
  ["alg.inequality_basic", "alg.square_sum_nonneg"], ["tech.qm_am_bound", "tech.use_constraint_reciprocal"], "specialized_grade9", 2,
  r"The condition is $\frac1a+\frac1b+\frac1c=1$; apply $(p+q+r)^2\le3(p^2+q^2+r^2)$ to $p=\frac1{\sqrt a}$, …", "prove",
  stem=r"Cho $a,b,c$ là các số thực dương thỏa mãn $ab+bc+ca=abc$.")
q(E, "2b", "algebra", r"Chứng minh $\left(\sqrt a+\sqrt b+\sqrt c\right)^2\le abc\le\frac{(a+b+c)^2}{3}$.", "proof", "official", "ptnk2023_2",
  ["alg.inequality_basic", "alg.square_sum_nonneg"], ["tech.qm_am_bound", "tech.am_gm_two", "tech.use_constraint_reciprocal"], "specialized_grade9", 3,
  r"Right: $(a+b+c)^2\ge3(ab+bc+ca)=3abc$. Left: $1=\sum\frac1a\ge\sum\frac1{\sqrt{ab}}$, multiply by $\sqrt{abc}$.", "prove",
  stem=r"Cho $a,b,c$ là các số thực dương thỏa mãn $ab+bc+ca=abc$.")
q(E, "3a", "combinatorics", r"Tính số ô đen trên mỗi hàng.", "2", "official", "ptnk2023_3",
  ["comb.counting", "nt.divisibility"], ["tech.double_counting", "tech.parity_mod"], "specialized_grade9", 2,
  "Count black cells by rows (4x) and by columns (four distinct values from 0…4, whose total must be divisible by 4).", "compute",
  stem=r"Người ta tô màu mỗi ô của bảng hình vuông $4\times4$ bằng một trong hai màu đen hoặc trắng thỏa mãn các điều kiện sau: i. Số ô đen trên các hàng đều bằng nhau. ii. Số ô đen trên các cột đôi một khác nhau.")
q(E, "3b", "combinatorics", r"Hai ô kề nhau trên một hàng hoặc một cột được gọi là “cặp tốt” nếu chúng được tô bằng hai màu khác nhau. Hỏi tổng số các “cặp tốt” tính theo tất cả các cột có thể lớn nhất là bao nhiêu? Hỏi tương tự cho các “cặp tốt” tính theo tất cả các hàng.",
  "4 (theo cột); 11 (theo hàng)", "official", "ptnk2023_3",
  ["comb.counting", "comb.extremal"], ["tech.bounding", "tech.contradiction", "tech.construction"], "specialized_grade9", 4,
  "Columns: only columns with 1 or 3 black cells contribute, at most 2 each. Rows: 3 per row would force alternating rows, contradicting the all-black column.", "compute",
  stem=r"Người ta tô màu mỗi ô của bảng hình vuông $4\times4$ bằng một trong hai màu đen hoặc trắng thỏa mãn các điều kiện sau: i. Số ô đen trên các hàng đều bằng nhau. ii. Số ô đen trên các cột đôi một khác nhau.",
  errors=["answering 12 for rows (upper bound not attained)"])
STEM4 = r"Cho $m,n$ là các số nguyên không âm thỏa mãn $m^2-n=1$."
q(E, "4a", "number_theory", r"Đặt $n^2-m=a$. Chứng minh rằng $a$ là số lẻ.", "proof", "official", "ptnk2023_4", ["nt.parity"], ["tech.parity_mod"], "standard_grade9", 1,
  r"$m^2-n=1$ forces $m,n$ of different parity, so $n^2-m$ is odd.", "prove", stem=STEM4)
q(E, "4b", "number_theory", r"Chứng minh rằng nếu $a=3\cdot2^k+1$ với $k$ là số nguyên dương thì $k=1$.", "proof", "official", "ptnk2023_4",
  ["nt.divisibility", "alg.factorization", "nt.parity"], ["tech.subtract_equations", "tech.factor_and_case", "tech.case_analysis"], "specialized_grade9", 3,
  r"Subtract: $(n-m)(n+m+1)=3\cdot2^k$ with $n-m$ odd, so $n-m\in\{1,3\}$; each case pins $k$.", "prove", stem=STEM4)
q(E, "4c", "number_theory", r"Chứng minh rằng $a$ không thể là số chính phương.", "proof", "official", "ptnk2023_4",
  ["nt.perfect_squares", "alg.inequality_basic"], ["tech.squeeze_between_squares", "tech.contradiction"], "specialized_grade9", 3,
  r"With $n=m^2-1$, $a=(m^2-1)^2-m$ lies strictly between $(m^2-2)^2$ and $(m^2-1)^2$ for $m\ge2$.", "prove", stem=STEM4)
STEM5 = r"Cho tam giác $ABC$. Gọi $D,E,F$ là các tiếp điểm của đường tròn $(I)$ nội tiếp tam giác $ABC$ với $BC,CA,AB$. Từ chân đường phân giác ngoài $L$ của góc $\widehat{BAC}$ ($L$ thuộc $BC$), kẻ tiếp tuyến $LH$ đến đường tròn $(I)$ ($H$ thuộc $(I)$, $H\ne D$)."
for sub, text, tech, diff, ins in [
    ("5a", r"Chứng minh rằng đường tròn ngoại tiếp tam giác $ALH$ đi qua tâm nội tiếp $I$.", ["tech.right_angle_concyclic"], 2, r"$\widehat{LAI}=\widehat{LHI}=90^\circ$."),
    ("5b", r"Chứng minh $\widehat{BAD}=\widehat{CAH}$.", ["tech.angle_chasing", "tech.right_angle_concyclic"], 3, r"$A,H,D,I,L$ are concyclic (diameter $IL$); equal chords $ID=IH$ give equal angles at $A$."),
    ("5c", r"$AH$ cắt lại $(I)$ tại $K$. Gọi $G$ là trọng tâm tam giác $KEF$ và $J$ là giao điểm của $DG$ với $EF$. Chứng minh $KJ\perp EF$.", ["tech.angle_chasing", "tech.midline_symmetry"], 4, r"$EFDK$ is an isosceles trapezoid; $J$ divides the midline so that $NKJT$ is a rectangle."),
    ("5d", r"Gọi $S$ là trung điểm $BC$, $KJ$ cắt lại $(I)$ tại $R$. Chứng minh rằng $EF$, $IR$ và $AS$ đồng quy.", ["tech.known_lemma", "tech.auxiliary_parallel"], 5, r"Lemma: $AS$, $DI$, $EF$ are concurrent; $D,I,R$ are collinear because $\widehat{DER}=90^\circ$."),
]:
    q(E, sub, "geometry", text, "proof", "official", None, ["geo.incircle_tangents", "geo.cyclic_quad", "geo.angle_bisector_external"] + (["geo.isosceles_trapezoid", "geo.centroid"] if sub in ("5c",) else []) + (["geo.midpoint_parallel"] if sub == "5d" else []),
      tech, "specialized_grade9" if diff <= 3 else "olympiad_style", diff, ins, "prove", stem=STEM5, diagram="described in text (incircle configuration)")

# ---------------------------------------------------------------- PTNK 2024
E = "ptnk-2024-chuyen"
q(E, "1.1", "algebra", r"Giải hệ phương trình $\begin{cases}x^3+z^3=y\\ y^3+x^3=z\\ z^3+y^3=x\end{cases}$.", r"$x=y=z\in\{0;\tfrac{1}{\sqrt2};-\tfrac{1}{\sqrt2}\}$", "official", "ptnk2024_1",
  ["alg.system_symmetric", "alg.factorization", "alg.square_sum_nonneg"], ["tech.subtract_equations", "tech.factor_and_case"], "specialized_grade9", 2,
  r"(1)−(2): $(z-y)(z^2+zy+y^2+1)=0$ and the second factor is positive, so $y=z$; likewise $x=z$.", "solve")
q(E, "1.2", "algebra", r"Cho hai số nguyên dương $a,b$ phân biệt. Chứng minh phương trình sau có đúng ba nghiệm $\left(\sqrt x-1\right)\left[x^2-2(a+b)x+ab+2\right]=0$.", "proof", "official", "ptnk2024_1",
  ["alg.discriminant", "alg.vieta", "alg.radicals_domain"], ["tech.case_analysis", "tech.factor_and_case"], "specialized_grade9", 2,
  r"The quadratic has $\Delta'=a^2+b^2+ab-2>0$, $S,P>0$ (two positive roots), and $x=1$ is a root only if $(a-2)(b-2)=1$, i.e. $a=b$.", "prove",
  errors=["forgetting the domain $x\\ge0$", "not excluding $x=1$ as a common root"])
q(E, "2", "algebra", r"Cho ba số thực $a,b,c$ không âm thỏa mãn $a^2+b^2+c^2+3=2(ab+bc+ca)$. Chứng minh $3\le a+b+c\le\frac{2(ab+bc+ca)+3}{3}$.", "proof", "official", "ptnk2024_2",
  ["alg.inequality_basic", "alg.square_sum_nonneg", "alg.identities"], ["tech.rewrite_with_symmetric_sums", "tech.square_completion"], "specialized_grade9", 3,
  r"The condition is $(a+b+c)^2+3=4(ab+bc+ca)$; both bounds reduce to $(a+b+c)^2\ge3(ab+bc+ca)$ and $(a+b+c-3)^2\ge0$.", "prove")
STEM3 = r"Với mỗi số tự nhiên $n$, đặt $a_n=\left(2+\sqrt3\right)^n+\left(2-\sqrt3\right)^n$."
q(E, "3a", "algebra", r"Chứng minh $a_{n+2}=4a_{n+1}-a_n$ với mọi $n=0,1,2,\ldots$", "proof", "official", "ptnk2024_3", ["alg.radicals", "alg.recurrence", "alg.vieta"], ["tech.characteristic_roots"], "specialized_grade9", 2,
  r"$2\pm\sqrt3$ are the roots of $t^2-4t+1=0$.", "prove", stem=STEM3)
q(E, "3b", "number_theory", r"Tìm $n$ để $a_n$ chia hết cho 4.", "$n$ lẻ", "official", "ptnk2024_3", ["nt.modular_arithmetic", "alg.recurrence"], ["tech.periodicity_mod", "tech.induction"], "specialized_grade9", 3,
  r"Modulo 4 the recurrence is $a_{n+2}\equiv-a_n$; with $a_0=2$, $a_1=4$.", "solve", stem=STEM3,
  errors=["the official key writes 'nếu n chẵn' for the odd case (typo)"])
q(E, "3c", "number_theory", r"Tìm $n$ để $a_n$ chia hết cho 14.", r"$n=4k+2$ (tức $n=8k+2$ hoặc $n=8k+6$)", "official", "ptnk2024_3", ["nt.modular_arithmetic", "alg.recurrence"], ["tech.periodicity_mod"], "specialized_grade9", 3,
  r"Every $a_n$ is even, so only divisibility by 7 matters; the residues mod 7 are periodic.", "solve", stem=STEM3)
STEM4 = r"Cho tứ giác $ABCD$ nội tiếp đường tròn $(O)$ có tam giác $ABD$ là tam giác nhọn và đường chéo $AC$ đi qua tâm $O$ của đường tròn $(O)$. Gọi $I$ là trung điểm $BD$, $H$ là trực tâm của tam giác $ABD$, $E$ là giao điểm khác $A$ của $AI$ với $(O)$ và $K$ là hình chiếu vuông góc của $H$ lên $AI$."
for sub, text, tech, diff, ins in [
    ("4a", r"Chứng minh $CEHK$ là hình bình hành và $IB^2=ID^2=IA\cdot IK$.", ["tech.parallelogram_from_orthocenter", "tech.power_of_point"], 3, r"$BHDC$ is a parallelogram (diameter $AC$), so $I$ is the midpoint of $HC$; then $\triangle IKH\cong\triangle IEC$."),
    ("4b", r"Lấy điểm $F$ trên cung nhỏ $BD$ của đường tròn $(O)$ sao cho $\widehat{BAF}=\widehat{DAI}$. Chứng minh các điểm $K$ và $F$ đối xứng nhau qua đường thẳng $BD$.", ["tech.angle_chasing", "tech.reflection"], 3, r"$EF\parallel BD$ and $IF=IE=IK$."),
    ("4c", r"Chứng minh các đường phân giác trong các góc $\widehat{BAD}$ và $\widehat{BKD}$ cắt nhau trên $BD$.", ["tech.similar_triangles", "tech.angle_bisector_ratio"], 3, r"From $IB^2=IA\cdot IK$: $\frac{KB}{AB}=\frac{KD}{AD}$, then the angle-bisector theorem."),
    ("4d", r"Trên đường thẳng qua $H$ và song song $AC$ lấy điểm $T$ sao cho $TH=TK$. Chứng minh các điểm $O,K,F,T$ cùng thuộc một đường tròn.", ["tech.reflection", "tech.isosceles_trapezoid_cyclic"], 5, r"The circle $(BHKD)$ is the reflection of $(O)$ in $BD$; its centre is $T$."),
]:
    q(E, sub, "geometry", text, "proof", "official", None, ["geo.cyclic_quad", "geo.orthocenter", "geo.power_of_point", "geo.similar_triangles"] + (["geo.reflection"] if sub in ("4b", "4d") else []) + (["geo.angle_bisector_theorem"] if sub == "4c" else []),
      tech, "specialized_grade9" if diff <= 3 else "olympiad_style", diff, ins, "prove", stem=STEM4, diagram="official figure in the answer key")
q(E, "5a", "combinatorics", r"Biết rằng tổng các số được ghi trên 16 thẻ bất kỳ trong số 31 thẻ trên luôn lớn hơn tổng các số được ghi trên 15 thẻ còn lại. Chứng minh $a_1\ge226$.", "proof", "official", "ptnk2024_5",
  ["comb.extremal", "alg.inequality_basic"], ["tech.extremal_choice", "tech.pairing_differences"], "specialized_grade9", 3,
  r"Use the 16 smallest vs the 15 largest: $a_1>\sum_{i=2}^{16}(a_{i+15}-a_i)\ge15\cdot15$.", "prove",
  stem=r"Cho các số nguyên dương $a_1<a_2<\cdots<a_{30}<a_{31}$. Người ta ghi tất cả các số này lên 31 chiếc thẻ, mỗi thẻ ghi một số.")
q(E, "5b", "combinatorics", r"Lấy $a_1,a_2,\ldots,a_{31}$ là 31 số nguyên dương đầu tiên: $1,2,\ldots,31$. Người ta bỏ 31 thẻ được ghi các số này vào hai chiếc hộp một cách ngẫu nhiên. Khi kiểm tra một hộp thì thấy rằng trong hộp đó không có hai thẻ nào có tổng hai số được ghi là số chính phương. Chứng minh trong hộp còn lại ta có thể chọn ra được bốn thẻ và chia chúng thành hai cặp sao cho tổng hai số được ghi trên mỗi cặp là số chính phương.",
  "proof", "official", "ptnk2024_5", ["comb.pigeonhole", "nt.perfect_squares", "comb.graph_coloring"], ["tech.pigeonhole", "tech.forced_chain"], "olympiad_style", 4,
  r"6, 19, 30 pairwise sum to squares, so one box holds two of them; then follow forced placements 1 → 3, 8, 15, 24 → 13 → 12.", "prove",
  stem=r"Cho các số nguyên dương $a_1<a_2<\cdots<a_{30}<a_{31}$. Người ta ghi tất cả các số này lên 31 chiếc thẻ, mỗi thẻ ghi một số.")

# ---------------------------------------------------------------- PTNK 2025 (no official key obtained)
E = "ptnk-2025-chuyen"
STEM1 = r"Cho phương trình $x^2-2(m+1)x+2m=0$ ($m$ là tham số)."
q(E, "1a", "algebra", r"Chứng minh rằng với mọi $m$ phương trình luôn có hai nghiệm phân biệt $x_1,x_2$.", "proof", "derived", "ptnk2025_1", ["alg.discriminant"], ["tech.square_completion"], "standard_grade9", 1, r"$\Delta'=m^2+1>0$.", "prove", stem=STEM1)
q(E, "1b", "algebra", r"Chứng minh $x_1^4+x_2^4>\frac92$.", "proof", "derived", "ptnk2025_1", ["alg.vieta", "alg.identities", "alg.inequality_basic"], ["tech.rewrite_with_symmetric_sums", "tech.square_completion"], "specialized_grade9", 3,
  r"$x_1^2+x_2^2=4(m^2+m+1)\ge3$ and $x_1^4+x_2^4=(x_1^2+x_2^2)^2-8m^2$; bound by cases (the true minimum is about 6.05).", "prove", stem=STEM1)
q(E, "1c", "algebra", r"Chứng minh $\left(x_1+\sqrt{x_1^2+1}\right)\left(x_2+\sqrt{x_2^2+1}\right)=1$ khi và chỉ khi $m=-1$.", "proof", "derived", "ptnk2025_1", ["alg.radicals", "alg.vieta", "alg.function_monotonic"], ["tech.conjugate_multiplication", "tech.monotonicity"], "specialized_grade9", 4,
  r"$(x+\sqrt{x^2+1})(-x+\sqrt{x^2+1})=1$, and $t\mapsto t+\sqrt{t^2+1}$ is increasing, so the product is 1 iff $x_2=-x_1$, i.e. $S=0$.", "prove", stem=STEM1)
STEM2 = r"Người ta muốn ghi bốn số thực ở bốn đỉnh của hình vuông $ABCD$ (mỗi đỉnh một số) thỏa mãn: i) Bốn số được ghi là đôi một phân biệt; ii) Tổng hai số được ghi ở hai đầu của cạnh $AB$ là 0; iii) Tổng hai số được ghi ở hai đầu của ba cạnh còn lại là ba giá trị phân biệt: 1, 2, 3."
q(E, "2a", "algebra", r"Hãy chỉ ra một cách ghi thỏa mãn các điều kiện trên.", r"ví dụ $A=\tfrac14,\ B=-\tfrac14,\ C=\tfrac54,\ D=\tfrac74$", "derived", "ptnk2025_2", ["alg.system_linear"], ["tech.construction"], "standard_grade9", 2,
  r"$(a+b)+(c+d)=(b+c)+(d+a)$ forces the edge $CD$ to carry 3 and $BC, DA$ to carry 1 and 2.", "construct", stem=STEM2)
q(E, "2b", "algebra", r"Trong các cách ghi thỏa mãn các điều kiện trên, tìm cách ghi có tổng bình phương của các số ở bốn đỉnh là nhỏ nhất.", r"giá trị nhỏ nhất $\tfrac{19}{4}$, tại $(A,B,C,D)=(\tfrac14,-\tfrac14,\tfrac54,\tfrac74)$ hoặc $(-\tfrac14,\tfrac14,\tfrac74,\tfrac54)$", "derived", "ptnk2025_2",
  ["alg.system_linear", "alg.quadratic_extremum"], ["tech.one_parameter_family", "tech.square_completion"], "specialized_grade9", 3, r"All labellings form a one-parameter family $b=t$; the sum of squares is a quadratic in $t$.", "compute", stem=STEM2)
STEM3 = r"Cho các số nguyên dương $m,n$ thỏa mãn: $m^2+m+n^2$ chia hết cho tích $mn$ (1)."
q(E, "3a", "number_theory", r"Chứng minh không tồn tại $m,n$ thỏa mãn (1) khi $n=3$.", "proof", "derived", "ptnk2025_3", ["nt.divisibility", "nt.modular_arithmetic"], ["tech.case_analysis", "tech.parity_mod"], "specialized_grade9", 2,
  r"$3m\mid m^2+m+9$ forces $m\mid9$ and $3\mid m^2+m$; check $m\in\{1,3,9\}$.", "prove", stem=STEM3)
q(E, "3b", "number_theory", r"Tìm $m,n$ thỏa mãn (1) biết $m$ chia hết cho $n$.", r"$(m,n)\in\{(1,1);(4,2)\}$", "derived", "ptnk2025_3", ["nt.divisibility"], ["tech.substitution_m_kn", "tech.bounding"], "specialized_grade9", 3,
  r"With $m=kn$: $k+\frac1n+\frac1k\in\mathbb Z$, so $\frac1n+\frac1k\in\{1,2\}$.", "solve", stem=STEM3)
q(E, "3c", "number_theory", r"Ký hiệu $d$ là ước chung lớn nhất của $m$ và $n$. Chứng minh nếu $m,n$ thỏa mãn (1) thì $m=d^2$.", "proof", "derived", "ptnk2025_3", ["nt.gcd", "nt.divisibility"], ["tech.gcd_decomposition"], "olympiad_style", 4,
  r"Write $m=dx$, $n=dy$ with $\gcd(x,y)=1$; then $x\mid y^2d$ gives $x\mid d$ and $d\mid x$.", "prove", stem=STEM3)
STEM4 = r"Cho tam giác $ABC$ nhọn nội tiếp đường tròn $(O)$ có $\hat A>\hat B>\hat C$ và điểm $D$ trên cung nhỏ $AC$ sao cho $CD>AB$. Đường trung trực của $DB$ cắt $AB$ tại $E$; đường trung trực của $DC$ cắt $AC$ tại $F$."
for sub, text, diff in [
    ("4a", r"Chứng minh các điểm $A,D,E,F$ thuộc một đường tròn và đường tròn này đi qua tâm $O$ của $(O)$.", 3),
    ("4b", r"Chứng minh rằng tam giác $DBE$ và tam giác $DCF$ đồng dạng. Chứng minh rằng đường cao qua $D$ của tam giác $DEF$ và đường cao qua $A$ của tam giác $ABC$ cắt nhau trên $(O)$.", 4),
    ("4c", r"Ký hiệu $(I)$ là đường tròn tâm $I$, đi qua các điểm $A,D,E,F$. Tiếp tuyến của $(I)$ tại $O$ cắt tiếp tuyến của $(O)$ tại $D$ ở $S$. Gọi $R$ là trung điểm $OD$ và $K$ là giao điểm của $SI$ với đường tròn ngoại tiếp tam giác $SDO$ ($K\ne S$). Chứng minh $\widehat{RKD}=90^\circ$ và $DK$ đi qua trung điểm của $IR$.", 5),
]:
    q(E, sub, "geometry", text, "proof", "derived", None, ["geo.cyclic_quad", "geo.perpendicular_bisector", "geo.similar_triangles", "geo.tangent_properties"],
      ["tech.angle_chasing", "tech.similar_triangles"], "specialized_grade9" if diff <= 3 else "olympiad_style", diff, "Isosceles triangles DEB, DFC from the perpendicular bisectors; angle chasing on (O).", "prove", stem=STEM4)
STEM5 = r"Cho bảng ô vuông kích thước $2\times9$ và số nguyên dương $k\le18$. Hai ô của bảng được gọi là kề bên nếu chúng có một cạnh chung. Hai bạn An và Bình chơi trò “Truy Tìm Tàu Ngầm” như sau: Trước khi trò chơi bắt đầu, An chọn một ô trên bảng và không cho Bình biết. Ở mỗi lượt chơi: An phải chọn một ô mới, kề bên với ô đã chọn trước đó, và không cho Bình biết; Sau khi An chọn xong, Bình chọn $k$ ô của bảng và hỏi An: trong $k$ ô này có ô An vừa chọn hay không? Nếu có thì Bình thắng, nếu không thì hai bạn lại chơi lượt tiếp theo."
q(E, "5a", "combinatorics", r"Xét $k=4$. Chứng minh rằng Bình có thể thắng sau không quá 8 lượt chơi.", "proof", "derived", None, ["comb.game_strategy", "comb.invariant"], ["tech.sweep_strategy", "tech.parity_coloring"], "olympiad_style", 4,
  "Sweep the columns with a 2-column window; parity (chessboard colouring) of the submarine's cell alternates each turn.", "prove", stem=STEM5)
q(E, "5b", "combinatorics", r"Xét $k=2$. Chứng minh rằng Bình có thể thắng sau không quá 16 lượt chơi.", "proof", "derived", None, ["comb.game_strategy", "comb.invariant"], ["tech.sweep_strategy", "tech.parity_coloring"], "olympiad_style", 5,
  "Use the colouring parity to sweep one column per turn in each parity class (two passes of 8).", "prove", stem=STEM5)

# ---------------------------------------------------------------- TP.HCM 2025 (Sở, chuyên Toán)
E = "hcm-2025-chuyen"
q(E, "1a", "algebra", r"Với $a,b$ là các số thực dương thỏa mãn $(a+b)(a-b)=1$. Tính giá trị của biểu thức $P=\sqrt{(4a+5)^2+(3b)^2}-\sqrt{(4a-5)^2+(3b)^2}$.", "$P=8$", "official", "hcm2025_1",
  ["alg.radicals", "alg.identities"], ["tech.use_constraint_substitution", "tech.perfect_square_under_root"], "specialized_grade9", 2,
  r"$b^2=a^2-1$ turns each radicand into a perfect square: $(5a\pm4)^2$.", "compute")
q(E, "1b", "algebra", r"Biết $a,b$ là hai nghiệm thực của phương trình $x^2-4x+c=0$ và $-a$ là một nghiệm thực của phương trình $11x^2-x+2c=0$ với $c$ là một số thực khác 0. Tính giá trị của biểu thức $a^{2025}+b^{2025}+c^{2025}$.", "$-1$", "official", "hcm2025_1",
  ["alg.vieta"], ["tech.eliminate_parameter"], "standard_grade9", 2, r"Eliminate $c=4a-a^2$: $9a^2+9a=0$, $a=-1$, $b=5$, $c=-5$.", "compute")
q(E, "2a", "word_problem", r"Một ô tô và một xe tải chuyển động cùng tốc độ không đổi $a$ (km/h) dọc theo hai con đường giao nhau hướng đến giao lộ ($a>0$). Biết rằng vào các thời điểm 14 giờ và 15 giờ cùng ngày, khoảng cách từ ô tô đến giao lộ đều gấp đôi khoảng cách từ xe tải đến giao lộ. Hỏi xe tải đến giao lộ lúc mấy giờ?",
  "14 giờ 45 phút", "official", "hcm2025_2", ["word.motion", "alg.linear_equation"], ["tech.case_analysis", "tech.set_unknown"], "standard_grade9", 2,
  "If both were still approaching, the ratio could not stay 2; so the truck passed the junction: $2x-a=2(a-x)$.", "compute",
  errors=["assuming the truck has not yet passed the junction (gives a = 0)"])
q(E, "2b", "applied_optimization", r"Anh Hà dự định làm một cái máng nước có dạng hình lăng trụ đứng có đáy là hình thang cân từ một miếng tôn có dạng hình chữ nhật $ABCD$ với chiều dài 2 (m) và chiều rộng 1 (m). Anh Hà thực hiện làm máng nước bằng cách gấp đều hai bên chiều rộng $AB$ của miếng tôn, mỗi bên $x$ (m), lên một góc $60^\circ$ như hình vẽ. Tìm $x$ để hình thang cân $EFGH$ có diện tích lớn nhất?",
  r"$x=\tfrac13$ (m)", "official", "hcm2025_2", ["geo.trapezoid_area", "geo.trig_ratios", "alg.quadratic_extremum"], ["tech.set_unknown", "tech.square_completion"], "standard_grade9", 2,
  r"Height $\frac{\sqrt3}{2}x$, bases $1-2x$ and $1-x$: area $\frac{\sqrt3}{4}x(2-3x)$.", "compute", diagram="figure: trapezoid cross-section and the folded sheet (needed for the setup)")
STEM3 = r"Cho tam giác nhọn $ABC$ ($AB<AC$) nội tiếp đường tròn $(O)$ có $BE,CF$ là các đường cao. Gọi $M,K$ theo thứ tự là trung điểm của các đoạn thẳng $BC,EF$. Gọi $N$ là giao điểm của hai đường thẳng $AM$ và $EF$. Kẻ $ND$ vuông góc với $BC$ tại $D$."
q(E, "3a", "geometry", r"Chứng minh rằng $\widehat{AKE}=\widehat{AMB}$ và ba điểm $A,K,D$ thẳng hàng.", "proof", "official", None, ["geo.cyclic_quad", "geo.similar_triangles", "geo.midpoint_parallel"], ["tech.similar_triangles", "tech.angle_chasing"], "specialized_grade9", 3,
  r"$\triangle AEF\sim\triangle ABC$ maps the median $AK$ to the median $AM$.", "prove", stem=STEM3)
q(E, "3b", "geometry", r"Tiếp tuyến tại $A$ của đường tròn $(O)$ cắt đường thẳng $BC$ tại $Q$. Chứng minh rằng $QB\cdot DC=QC\cdot DB$.", "proof", "official", None, ["geo.tangent_properties", "geo.similar_triangles", "geo.angle_bisector_theorem"], ["tech.cross_ratio_harmonic", "tech.similar_triangles"], "olympiad_style", 4,
  r"Show $\frac{DB}{DC}=\frac{AB^2}{AC^2}=\frac{QB}{QC}$.", "prove", stem=STEM3)
q(E, "4a", "number_theory", r"Tìm hai số đẹp có hai chữ số và chia hết cho 11.", "hai trong các số 11, 44, 77, 88, 99 (ví dụ $11=2^2+7\cdot1^2$, $44=4^2+7\cdot2^2$)", "official", "hcm2025_4", ["nt.quadratic_forms"], ["tech.construction", "tech.small_case_search"], "standard_grade9", 1,
  "Try small $b$ and check whether $n-7b^2$ is a square.", "construct", stem=r"Số nguyên dương $n$ được gọi là số đẹp nếu tồn tại các số nguyên $a,b$ sao cho $n=a^2+7b^2$.")
q(E, "4b", "number_theory", r"Chứng minh rằng nếu $n$ là số đẹp và $n$ chia hết cho 11 thì $\frac{n}{11}$ cũng là số đẹp.", "proof", "official", "hcm2025_4", ["nt.quadratic_forms", "nt.modular_arithmetic", "alg.identities"], ["tech.brahmagupta_identity", "tech.parity_mod"], "olympiad_style", 5,
  r"$a^2+7b^2\equiv0\pmod{11}$ means $a^2\equiv4b^2$, so $a\equiv\pm2b\pmod{11}$; then $11n=(2a\pm7b)^2+7(a\mp2b)^2$ with both brackets divisible by 11.", "prove", stem=r"Số nguyên dương $n$ được gọi là số đẹp nếu tồn tại các số nguyên $a,b$ sao cho $n=a^2+7b^2$.")
q(E, "5a", "probability", r"Gọi $S$ là tập hợp các số nguyên có giá trị tuyệt đối không vượt quá 100. Chọn ngẫu nhiên một số nguyên $a$ thuộc tập $S$. Tính xác suất sao cho số $a$ được chọn thoả mãn các nghiệm của phương trình $x^2-ax+2a+10=0$ đều là số nguyên.",
  r"$\tfrac{4}{201}$", "official", "hcm2025_5", ["prob.classical", "alg.vieta", "nt.divisibility"], ["tech.vieta_integer_roots", "tech.factor_and_case"], "specialized_grade9", 3,
  r"Vi-ét: $x_1x_2-2(x_1+x_2)=10$, i.e. $(x_1-2)(x_2-2)=14$; four factor pairs give $a\in\{-11,-5,13,19\}$.", "compute")
q(E, "5b", "combinatorics", r"Cho tập hợp $A=\{1;2;3;\ldots;100\}$ và tập hợp $B$ là tập hợp con chứa 11 phần tử của tập hợp $A$. Chứng minh rằng tập hợp $B$ luôn chứa ba số $a,b,c$ phân biệt sao cho $a,b,c$ là độ dài ba cạnh của một tam giác.", "proof", "official", None,
  ["comb.extremal", "geo.triangle_inequality"], ["tech.contradiction", "tech.fibonacci_growth"], "specialized_grade9", 3,
  "Sort; if no triple works, $b_{i+2}\ge b_i+b_{i+1}$, so the 11th element is at least the 11th Fibonacci number 89… and in fact exceeds 100.", "prove")

# ---------------------------------------------------------------- Hà Nội 2025 (Sở, chuyên Toán)
E = "hanoi-2025-chuyen"
q(E, "I.1", "statistics", r"Giải bơi của một trường Trung học cơ sở ban đầu chỉ có học sinh khối 6, 7 và 8 đăng kí tham gia với số liệu học sinh được cho như trong biểu đồ cột kép ở hình bên (Khối 6: 8 nữ, 12 nam; Khối 7: 7 nữ, 10 nam; Khối 8: 5 nữ, 8 nam). Ngay trước khi giải đấu diễn ra, có thêm 6 học sinh nam khối 9 và một số học sinh nữ khối 9 đăng kí bổ sung. Biết rằng tỉ lệ học sinh nữ so với tổng số học sinh đăng kí tham gia giải trước và sau khi các học sinh khối 9 đăng kí bổ sung là không thay đổi. Tìm số học sinh nữ khối 9 đã đăng kí thi đấu.",
  "4", "teacher", "hanoi2025_1", ["stat.read_chart", "alg.linear_equation"], ["tech.set_unknown"], "standard_grade9", 1, r"$\frac{20}{50}=\frac{20+g}{56+g}$.", "compute", diagram="double bar chart (values transcribed into the text)")
q(E, "I.2", "algebra", r"Cho $a,b,c$ là các số thực khác 0, thỏa mãn $a+b+c\ne0$ và $ab+bc+ca=0$. Tính giá trị của biểu thức $P=\frac{1}{a^2-bc}+\frac{1}{b^2-ca}+\frac{1}{c^2-ab}$.", "$P=0$", "teacher", "hanoi2025_1",
  ["alg.identities", "alg.rational_expressions"], ["tech.use_constraint_substitution"], "specialized_grade9", 2, r"$a^2-bc=a(a+b+c)$, so $P=\frac{ab+bc+ca}{abc(a+b+c)}=0$.", "compute")
q(E, "II.1", "number_theory", r"Cho $a,b,c$ là các số nguyên thỏa mãn $3a^2-bc$, $3b^2-ca$, $3c^2-ab$ đều chia hết cho 4. Chứng minh $abc$ chia hết cho 8.", "proof", "teacher", None, ["nt.parity", "nt.modular_arithmetic"], ["tech.case_analysis", "tech.parity_mod"], "specialized_grade9", 3,
  "Case on how many of a, b, c are odd, working mod 4.", "prove")
q(E, "II.2", "number_theory", r"Tìm tất cả cặp số nguyên $(x,y)$ thỏa mãn $2(2x-y)(y-x)^2=15x-7y+7$.", r"$(x,y)\in\{(-7,-14);(-2,-3);(4,7)\}$", "teacher", "hanoi2025_2",
  ["nt.diophantine", "alg.factorization"], ["tech.change_of_variables", "tech.divisor_cases"], "specialized_grade9", 3, r"With $u=y-x$, $v=2x-y$ (so $x=u+v$, $y=2u+v$) the equation becomes $v(2u^2-8)=u+7$, hence $2u^2-8\mid u+7$: only small $u$ remain.", "solve")
STEM3 = r"Với các số thực $a,b,c$ thỏa mãn $a^2b+b^2c+c^2a+16=ab^2+bc^2+ca^2$."
q(E, "III.1a", "algebra", r"Chứng minh $(a-b)(b-c)(c-a)=16$.", "proof", "teacher", "hanoi2025_3", ["alg.factorization", "alg.identities"], ["tech.factor_and_case"], "standard_grade9", 1, r"$ab^2+bc^2+ca^2-a^2b-b^2c-c^2a=(a-b)(b-c)(c-a)$.", "prove", stem=STEM3)
q(E, "III.1b", "algebra", r"Tìm giá trị nhỏ nhất của biểu thức $P=a^2+b^2+c^2$.", "8", "teacher", "hanoi2025_3", ["alg.inequality_basic", "alg.am_gm"], ["tech.am_gm_two", "tech.shift_invariance"], "specialized_grade9", 4,
  r"Bound with $x=a-b$, $y=b-c$: $3P\ge x^2+y^2+(x+y)^2$, then AM–GM on $16=xy(x+y)$; equality at $(a,b,c)=(-2,0,2)$ up to order.", "compute", stem=STEM3)
q(E, "III.2", "number_theory", r"Tìm tất cả các số hữu tỉ dương $m$ và $n$ sao cho các biểu thức $m+n+mn$; $\frac1m+\frac1n+\frac1{mn}$ và $\frac mn$ đều nhận giá trị là số nguyên.",
  r"$(m,n)\in\{(1,1);(1,\tfrac12);(2,1);(2,\tfrac13);(3,\tfrac12)\}$", "teacher", "hanoi2025_4", ["nt.rationals_fractions", "nt.gcd", "nt.divisibility"], ["tech.gcd_decomposition", "tech.bounding", "tech.case_analysis"], "olympiad_style", 5,
  r"Write $m=\frac xy$, $n=\frac zt$ in lowest terms; divisibility forces $y=z=1$, then $t\mid x+1$ and $x\mid t+1$.", "solve")
STEM4 = r"Cho tam giác $ABC$ có ba góc nhọn ($AB<AC$), nội tiếp đường tròn $(O)$. Hai đường cao $AD,CF$ của tam giác $ABC$ cắt nhau tại điểm $H$. Gọi $M$ là trung điểm của đoạn thẳng $BC$. Tia $MH$ cắt đường tròn $(O)$ tại điểm $T$. Kẻ đường kính $AK$ của đường tròn $(O)$."
for sub, text, diff, tech in [
    ("IV.1", r"Chứng minh ba điểm $T,H,K$ thẳng hàng.", 2, ["tech.parallelogram_from_orthocenter"]),
    ("IV.2", r"Đường thẳng qua $B$ và vuông góc với đường thẳng $AM$ tại điểm $E$, cắt đường thẳng $AD$ tại điểm $G$. Đường tròn ngoại tiếp tam giác $MDG$ cắt đường tròn ngoại tiếp tam giác $ADC$ tại hai điểm $D$ và $N$. Chứng minh đường thẳng $NE$ song song với đường thẳng $BF$.", 4, ["tech.angle_chasing", "tech.orthocenter_of_auxiliary_triangle"]),
    ("IV.3", r"Kẻ dây cung $AX$ của đường tròn $(O)$ sao cho đường thẳng $AX$ song song với đường thẳng $BC$. Chứng minh ba đường thẳng $MX$, $TD$ và $AN$ đồng quy.", 5, ["tech.radical_axis_like_concurrency", "tech.angle_chasing"]),
]:
    q(E, sub, "geometry", text, "proof", "teacher", None, ["geo.orthocenter", "geo.cyclic_quad", "geo.midpoint_parallel"], tech, "specialized_grade9" if diff <= 3 else "olympiad_style", diff,
      r"$BHCK$ is a parallelogram (diameter $AK$), so $H$, $M$, $K$ are collinear." if sub == "IV.1" else "Several cyclic quadrilaterals around the altitudes; angle chasing.", "prove", stem=STEM4)
STEM5 = r"Hai trường trung học cơ sở $A$ và $B$ tổ chức chung một buổi liên hoan cho các học sinh tiêu biểu. Biết rằng trong buổi liên hoan này: (i) mỗi học sinh trường $A$ quen với đúng 5 học sinh khác cũng của trường $A$; (ii) mỗi học sinh trường $A$ quen với đúng 4 học sinh trường $B$; (iii) mỗi học sinh trường $B$ quen với đúng 3 học sinh trường $A$; (iv) tổng số học sinh của hai trường tham dự không vượt quá 80."
q(E, "V.1", "combinatorics", r"Số học sinh trường $A$ tham dự buổi liên hoan có thể là 25 học sinh được không? Vì sao?", "Không", "teacher", "hanoi2025_5", ["comb.double_counting", "nt.divisibility"], ["tech.double_counting", "tech.parity_mod"], "specialized_grade9", 2,
  r"Count A–B acquaintances twice: $4|A|=3|B|$, so $3\mid|A|$.", "compute", stem=STEM5)
q(E, "V.2", "combinatorics", r"Tổng số học sinh của hai trường tham dự buổi liên hoan có thể nhiều nhất là bao nhiêu? Vì sao?", "70", "teacher", "hanoi2025_5", ["comb.double_counting", "comb.construction"], ["tech.double_counting", "tech.construction"], "specialized_grade9", 3,
  r"$|A|$ is even (handshakes inside A) and divisible by 3, $|B|=\frac43|A|$, total $\frac73|A|\le80$; build 30 + 40.", "compute", stem=STEM5)

# ---------------------------------------------------------------- KHTN 2025 vòng 2
E = "khtn-2025-vong2"
q(E, "I.1", "algebra", r"Giải phương trình $\sqrt[4]{x+1}+\sqrt[4]{3x^2-2x+1}=\sqrt[4]{2x^2-x+1}+\sqrt[4]{x^2+1}$, trong đó với $a$ là số thực không âm thì $\sqrt[4]{a}=\sqrt{\sqrt a}$.", r"$x\in\{0;1\}$", "teacher", "khtn2025_1",
  ["alg.radicals_domain", "alg.function_monotonic"], ["tech.equal_differences", "tech.monotonicity"], "olympiad_style", 4,
  r"$(x+1)-(x^2+1)=(2x^2-x+1)-(3x^2-2x+1)=x-x^2$: compare the two differences of fourth roots.", "solve",
  errors=["numerical sign-change search misses both roots (the function only touches 0)"])
q(E, "I.2", "algebra", r"Giải hệ phương trình $\begin{cases}x+y+xy=3,\\ 1+12(x+y)=7y^3+6xy(y+3-xy).\end{cases}$", r"$(x,y)=(1,1)$", "teacher", "khtn2025_1",
  ["alg.system_nonlinear", "alg.identities"], ["tech.use_constraint_substitution", "tech.cube_identity"], "olympiad_style", 4, "Use $x+y=3-xy$ to rewrite the second equation as a perfect cube relation.", "solve")
q(E, "II.1", "number_theory", r"Tìm tất cả các cặp số nguyên dương $(x;y)$ thỏa mãn $25^y+\left(4^x+1\right)\left(4x^2+3x+3\right)=\left(4^x+4x^2+3x+4\right)5^y$.", r"$(x;y)\in\{(1;1);(2;2)\}$", "teacher", "khtn2025_2",
  ["nt.diophantine", "alg.factorization", "nt.exponential"], ["tech.factor_and_case", "tech.bounding"], "olympiad_style", 4,
  r"Factor as $(5^y-4^x-1)(5^y-4x^2-3x-3)=0$.", "solve")
q(E, "II.2", "algebra", r"Cho các số thực $x,y,z$ thỏa mãn $1<x,y,z<2$. Chứng minh rằng $\left(\frac{x^3}{y^3}+\frac{y^3}{z^3}+\frac{z^3}{x^3}\right)\left(\frac{x^3}{x^3+8z^3}+\frac{y^3}{y^3+8x^3}+\frac{z^3}{z^3+8y^3}\right)\ge\frac{3xy}{z^2+8xy}+\frac{3yz}{x^2+8yz}+\frac{3zx}{y^2+8zx}$.",
  "proof", "teacher", "khtn2025_3", ["alg.inequality_basic", "alg.am_gm"], ["tech.cauchy_schwarz_engel", "tech.bounding"], "olympiad_style", 5, "Bound each factor separately using $1<x,y,z<2$.", "prove")
STEM3 = r"Cho tam giác $ABC$ cân tại $A$ có $O$ là trung điểm $BC$ và $\widehat{BAC}<90^\circ$. Xét đường tròn $(O)$ tiếp xúc các cạnh $CA,AB$ theo thứ tự tại $R,Q$. Trên các cạnh $CA,AB$ lần lượt lấy $E,F$ (không trùng các đỉnh tam giác) sao cho $EF$ tiếp xúc $(O)$ tại $P$ và $EF$ không song song $BC$. Gọi $H,K$ lần lượt là trực tâm các tam giác $OFB$, $OEC$. Gọi giao điểm của $FH,EK$ với $BC$ lần lượt là $M,N$."
for sub, text, diff in [
    ("III.1", r"Chứng minh rằng hai tam giác $OHM$, $OKN$ đồng dạng và $\frac{OK}{OH}=\frac{AE}{AF}$.", 4),
    ("III.2", r"Dựng điểm $G$ sao cho $OHGK$ là hình bình hành. Chứng minh rằng $O,G,P$ thẳng hàng.", 5),
    ("III.3", r"Lấy $S,T$ lần lượt đối xứng với $Q,R$ qua $BC$. Giả sử $X$ là giao điểm của $SF$ và $TE$, $D$ là giao điểm của $BS$ và $CT$. Chứng minh rằng $AX$ song song với $PD$.", 5),
]:
    q(E, sub, "geometry", text, "proof", "teacher", None, ["geo.tangent_properties", "geo.orthocenter", "geo.similar_triangles"], ["tech.similar_triangles", "tech.angle_chasing"], "olympiad_style", diff,
      r"Classic: $\triangle BOF\sim\triangle CEO$ ($BF\cdot CE=OB^2$) when $EF$ is tangent to the circle centred at the midpoint.", "prove", stem=STEM3)
q(E, "IV", "number_theory", r"Một tập $M$ các số thực phân biệt được gọi là tập đặc biệt nếu nó có những tính chất sau: i) với mỗi $x,y\in M$, $x\ne y$ thì $xy\ne0$, $x+y\ne0$ và đúng một trong hai số $xy$, $x+y$ là số hữu tỷ; ii) với mỗi $x\in M$ thì $x^2$ là số vô tỷ. Hãy tìm số phần tử lớn nhất có thể có của tập đặc biệt.",
  "4 (ví dụ $\\{1+\\sqrt2;-1+\\sqrt2;2-\\sqrt2;-2-\\sqrt2\\}$)", "teacher", "khtn2025_4", ["nt.rational_irrational", "comb.extremal"], ["tech.contradiction", "tech.construction", "tech.case_analysis"], "olympiad_style", 5,
  "Among any three elements, the rational products/sums cannot be all of one type; five elements force a contradiction.", "compute",
  errors=["the teacher solution writes $(ab+ac)/(b+c)=2a$; it equals $a$ (the argument still works)"])
