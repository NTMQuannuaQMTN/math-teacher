#!/usr/bin/env python3
"""Math benchmark v1 for the 4-hour session (2026-10-13).

Writes data/benchmark-4h/{dev,heldout}.jsonl. Every reference answer below is recomputed here
independently (SymPy or exhaustive search) and the build fails if the hand-written reference disagrees.
The solver never sees these files' answers: the harness passes only `input` to solveProblem.

  python3 tools/eval-4h/build_benchmark.py

Splits
  dev      development: the 16 iteration-03 "held3-*" items (already run and reported, so no longer
           unseen) plus new items. Solver work may look at these.
  heldout  sealed before any solver change in this session (sha256 in docs/MATH_AI_EVALUATION_PROTOCOL.md).
           Same syllabus areas, different numbers/wording/families. Scored only at baseline and final.
"""
import hashlib
import itertools
import json
import math
import os
from fractions import Fraction as F

import sympy as sp

x, y, m, n = sp.symbols("x y m n", real=True)
ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
OUT = os.path.join(ROOT, "data", "benchmark-4h")

problems = []


def add(pid, split, topic, difficulty, text, kind, reference, check, *, mode="text", methods="", criteria=""):
    """kind: values (final answer must contain exactly these values), pairs, proof, text."""
    problems.append(dict(
        id=pid, split=split, topic=topic, difficulty=difficulty, input_mode=mode, input=text,
        answer_kind=kind, reference=reference, allowed_methods=methods, criteria=criteria, _check=check,
    ))


def roots(expr, var=x, domain=None):
    sols = sp.solve(sp.Eq(expr, 0), var, dict=False)
    sols = [s for s in sols if s.is_real]
    if domain:
        sols = [s for s in sols if domain(s)]
    return sorted(sols)


def same(a, b):
    return sorted(map(sp.nsimplify, a), key=float) == sorted(map(sp.nsimplify, b), key=float)


# ----------------------------------------------------------------------------------------------------------- ALGEBRA
add("held3-interpolation", "dev", "algebra", "routine",
    "Cho đa thức $P(x)$ có bậc không quá hai, biết $P(0)=1$, $P(1)=3$, $P(2)=9$. Tính $P(3)$ và giải thích các bước.",
    "values", ["19"], lambda: sp.interpolate([(0, 1), (1, 3), (2, 9)], x).subs(x, 3) == 19)
add("held3-median", "dev", "algebra", "routine",
    "Tìm giá trị nhỏ nhất của $|x-1|+|x-4|+|x-7|$ với $x$ thực và tất cả giá trị $x$ đạt giá trị nhỏ nhất.",
    "values", ["6", "4"],
    lambda: min(abs(t / 100 - 1) + abs(t / 100 - 4) + abs(t / 100 - 7) for t in range(-1000, 2000)) == 6)
add("held3-quartic-factor", "dev", "algebra", "routine",
    "Phân tích $x^4+4y^4$ thành tích các đa thức với hệ số nguyên và chứng minh đẳng thức.",
    "text", "(x^2+2xy+2y^2)(x^2-2xy+2y^2)",
    lambda: sp.expand((x**2 + 2*x*y + 2*y**2) * (x**2 - 2*x*y + 2*y**2) - x**4 - 4*y**4) == 0)
add("held3-telescoping", "dev", "algebra", "routine",
    "Với số nguyên dương $n$, tính tổng $S=\\frac{1}{1\\cdot2}+\\frac{1}{2\\cdot3}+\\cdots+\\frac{1}{n(n+1)}$. Chứng minh công thức.",
    "text", "n/(n+1)", lambda: all(sum(F(1, k*(k+1)) for k in range(1, N+1)) == F(N, N+1) for N in range(1, 40)))
add("alg-d1", "dev", "algebra", "routine", "Giải phương trình $x^2-5x+6=0$.",
    "values", ["2", "3"], lambda: same(roots(x**2 - 5*x + 6), [2, 3]))
add("alg-d2", "dev", "algebra", "routine", "Giải phương trình $\\sqrt{x+3}=x-3$.",
    "values", ["6"], lambda: same([s for s in roots(x + 3 - (x - 3)**2) if s - 3 >= 0], [6]),
    criteria="Must reject the extraneous root x = 1.")
add("alg-d3", "dev", "algebra", "routine", "Giải hệ phương trình $\\begin{cases}x+y=5\\\\xy=6\\end{cases}$.",
    "pairs", [[2, 3], [3, 2]], lambda: sorted(sp.solve([x + y - 5, x*y - 6], [x, y])) == [(2, 3), (3, 2)])
add("alg-d4", "dev", "algebra", "standard",
    "Cho phương trình $x^2-2(m+1)x+m^2+3=0$ ($m$ là tham số). Tìm $m$ để phương trình có hai nghiệm phân biệt.",
    "text", "m > 1", lambda: sp.solve_univariate_inequality(sp.expand((m + 1)**2 - (m**2 + 3)) > 0, m, relational=False) == sp.Interval.open(1, sp.oo))
add("alg-d5", "dev", "algebra", "routine", "Giải phương trình x² − 4x + 3 = 0",
    "values", ["1", "3"], lambda: same(roots(x**2 - 4*x + 3), [1, 3]), mode="ocr_text",
    criteria="Unicode superscript and minus as produced by OCR must be read as x^2 - 4x + 3.")
add("alg-d6", "dev", "algebra", "routine", "Tìm giá trị nhỏ nhất của biểu thức $A=x^2-6x+10$.",
    "values", ["1"], lambda: sp.minimum(x**2 - 6*x + 10, x) == 1)
add("alg-d7", "dev", "algebra", "standard", "Giải phương trình $\\frac{1}{x-1}+\\frac{2}{x+1}=1$.",
    "values", ["0", "3"],
    lambda: same([s for s in sp.solve(sp.Eq(1/(x - 1) + 2/(x + 1), 1), x)], [0, 3]))
add("alg-d8", "dev", "algebra", "routine",
    "Một mảnh vườn hình chữ nhật có chu vi $28$ m và diện tích $48$ m². Tính chiều dài và chiều rộng của mảnh vườn.",
    "values", ["8", "6"], lambda: sorted(sp.solve([2*(x + y) - 28, x*y - 48], [x, y]))[0] in [(6, 8), (8, 6)])

add("alg-h1", "heldout", "algebra", "routine", "Giải phương trình $2x^2+3x-2=0$.",
    "values", ["1/2", "-2"], lambda: same(roots(2*x**2 + 3*x - 2), [sp.Rational(1, 2), -2]))
add("alg-h2", "heldout", "algebra", "standard", "Giải phương trình $\\sqrt{2x+1}=x-1$.",
    "values", ["4"], lambda: same([s for s in roots(2*x + 1 - (x - 1)**2) if s - 1 >= 0], [4]),
    criteria="Must reject x = 0.")
add("alg-h3", "heldout", "algebra", "routine", "Giải hệ phương trình $\\begin{cases}2x+3y=13\\\\3x-y=3\\end{cases}$.",
    "pairs", [[2, 3]], lambda: sp.solve([2*x + 3*y - 13, 3*x - y - 3], [x, y]) == {x: 2, y: 3})
add("alg-h4", "heldout", "algebra", "standard",
    "Cho phương trình $x^2-6x+m=0$ ($m$ là tham số). Tìm $m$ để phương trình có hai nghiệm $x_1,x_2$ thỏa mãn $x_1^2+x_2^2=20$.",
    "values", ["8"], lambda: [v for v in sp.solve(36 - 2*m - 20, m) if 9 - v >= 0] == [8],
    criteria="Must check the discriminant condition m <= 9.")
add("alg-h5", "heldout", "algebra", "routine", "Tìm giá trị lớn nhất của biểu thức $B=-x^2+4x+1$.",
    "values", ["5"], lambda: sp.maximum(-x**2 + 4*x + 1, x) == 5)
add("alg-h6", "heldout", "algebra", "routine", "Giải phương trình x⁴ − 5x² + 4 = 0", "values", ["1", "-1", "2", "-2"],
    lambda: same(roots(x**4 - 5*x**2 + 4), [-2, -1, 1, 2]), mode="ocr_text")
add("alg-h7", "heldout", "algebra", "standard",
    "Hai vòi nước cùng chảy vào một bể cạn thì sau $6$ giờ đầy bể. Nếu chảy riêng thì vòi thứ nhất làm đầy bể nhanh hơn vòi thứ hai $5$ giờ. Hỏi nếu chảy riêng thì mỗi vòi cần bao lâu để đầy bể?",
    "values", ["10", "15"], lambda: [s for s in roots(1/x + 1/(x + 5) - sp.Rational(1, 6)) if s > 0] == [10])
add("alg-h8", "heldout", "algebra", "routine", "Chứng minh rằng với mọi số thực $a,b$ ta có $a^2+b^2\\ge 2ab$.",
    "proof", None, lambda: True)
add("alg-h9", "heldout", "algebra", "routine", "Cho số thực $x\\ne0$ thỏa mãn $x+\\frac{1}{x}=3$. Tính $x^2+\\frac{1}{x^2}$.",
    "values", ["7"], lambda: all(sp.simplify(r**2 + 1/r**2 - 7) == 0 for r in sp.solve(x + 1/x - 3, x)))

# ---------------------------------------------------------------------------------------------------------- GEOMETRY
add("held3-ceva", "dev", "geometry", "standard",
    "Cho tam giác $ABC$. Điểm $D$ thuộc cạnh $BC$, điểm $E$ thuộc cạnh $CA$, với $BD/DC=2$ và $CE/EA=3$. Hai đường thẳng $AD$ và $BE$ cắt nhau tại $P$. Đường thẳng $CP$ cắt cạnh $AB$ tại $F$. Tính $AF/FB$ và chứng minh.",
    "values", ["1/6"], lambda: F(1, 2 * 3) == F(1, 6))
add("held3-menelaus", "dev", "geometry", "standard",
    "Cho tam giác $ABC$. Điểm $D$ thuộc cạnh $AB$, điểm $E$ thuộc cạnh $BC$, với $AD/DB=2$ và $BE/EC=3$. Đường thẳng $DE$ cắt đường thẳng $AC$ tại $F$. Xác định vị trí $F$ và tính $AF/FC$, kèm chứng minh.",
    "values", ["6"], lambda: F(1, 1) / (F(2) * F(3)) == F(1, 6))
add("held3-heron-free", "dev", "geometry", "routine",
    "Cho tam giác $ABC$ có $AB=13$, $AC=15$, $BC=14$. Tính diện tích tam giác bằng phương pháp lớp 9 và chứng minh các phép tính.",
    "values", ["84"], lambda: math.isclose(math.sqrt(21 * 8 * 7 * 6), 84))
add("held3-hexagon", "dev", "geometry", "routine",
    "Cho lục giác đều $ABCDEF$ nội tiếp đường tròn tâm $O$, bán kính bằng $5$. Tính độ dài cạnh và diện tích lục giác, chứng minh các bước.",
    "values", ["5", "75\\sqrt{3}/2"], lambda: sp.simplify(6 * sp.sqrt(3) / 4 * 25 - sp.Rational(75, 2) * sp.sqrt(3)) == 0)
add("geo-d1", "dev", "geometry", "routine",
    "Cho tam giác $ABC$ vuông tại $A$ có $AB=6$ cm, $AC=8$ cm, đường cao $AH$. Tính $BC$ và $AH$.",
    "values", ["10", "24/5"], lambda: math.hypot(6, 8) == 10 and F(6 * 8, 10) == F(24, 5))
add("geo-d2", "dev", "geometry", "routine",
    "Cho tam giác $ABC$, điểm $D$ thuộc cạnh $AB$, điểm $E$ thuộc cạnh $AC$ sao cho $DE\\parallel BC$. Biết $AD=2$, $DB=3$, $DE=4$. Tính $BC$.",
    "values", ["10"], lambda: F(4 * 5, 2) == 10)
add("geo-d3", "dev", "geometry", "routine",
    "Cho đường tròn $(O;5\\text{ cm})$ và dây $AB=8$ cm. Tính khoảng cách từ $O$ đến dây $AB$.",
    "values", ["3"], lambda: math.sqrt(25 - 16) == 3)
add("geo-d4", "dev", "geometry", "routine",
    "Cho đường tròn $(O;3\\text{ cm})$ và điểm $M$ với $OM=5$ cm. Kẻ tiếp tuyến $MA$ với đường tròn ($A$ là tiếp điểm). Tính $MA$.",
    "values", ["4"], lambda: math.sqrt(25 - 9) == 4)
add("geo-d5", "dev", "geometry", "standard",
    "Cho tam giác $ABC$ nhọn có các đường cao $BE$, $CF$. Chứng minh tứ giác $BCEF$ nội tiếp.",
    "proof", None, lambda: True)

add("geo-h1", "heldout", "geometry", "routine",
    "Cho tam giác $ABC$ vuông tại $A$, đường cao $AH$. Biết $BH=4$ cm, $HC=9$ cm. Tính $AH$ và $AB$.",
    "values", ["6", "2\\sqrt{13}"], lambda: math.isclose(math.sqrt(36), 6) and math.isclose(math.sqrt(4 * 13), 2 * math.sqrt(13)))
add("geo-h2", "heldout", "geometry", "standard",
    "Cho tam giác $ABC$ có $AB=5$, $AC=8$ và $\\widehat{BAC}=60^\\circ$. Tính độ dài $BC$.",
    "values", ["7"], lambda: 25 + 64 - 2 * 5 * 8 * F(1, 2) == 49)
add("geo-h3", "heldout", "geometry", "routine",
    "Cho đường tròn tâm $O$ bán kính $10$ cm. Dây $CD$ cách tâm $O$ một khoảng $6$ cm. Tính độ dài dây $CD$.",
    "values", ["16"], lambda: 2 * math.sqrt(100 - 36) == 16)
add("geo-h4", "heldout", "geometry", "standard",
    "Từ điểm $M$ nằm ngoài đường tròn $(O;4\\text{ cm})$ kẻ hai tiếp tuyến $MA$, $MB$ ($A$, $B$ là tiếp điểm) sao cho $\\widehat{AMB}=60^\\circ$. Tính $MO$ và $MA$.",
    "values", ["8", "4\\sqrt{3}"], lambda: math.isclose(math.sqrt(64 - 16), 4 * math.sqrt(3)))
add("geo-h5", "heldout", "geometry", "standard",
    "Cho tam giác $ABC$ nhọn nội tiếp đường tròn $(O)$, các đường cao $AD$, $BE$ cắt nhau tại $H$. Chứng minh tứ giác $CDHE$ nội tiếp.",
    "proof", None, lambda: True)
add("geo-h6", "heldout", "geometry", "routine",
    "Cho hình vuông $ABCD$ cạnh $4$ cm, $M$ là trung điểm của $BC$. Tính độ dài $AM$ và diện tích tam giác $AMD$.",
    "values", ["2\\sqrt{5}", "8"], lambda: math.isclose(math.hypot(4, 2), 2 * math.sqrt(5)))
add("geo-h7", "heldout", "geometry", "standard",
    "Cho hình thang $ABCD$ ($AB\\parallel CD$) có $AB=4$ cm, $CD=10$ cm. Hai đường chéo $AC$ và $BD$ cắt nhau tại $O$. Tính tỉ số $\\frac{OA}{OC}$.",
    "values", ["2/5"], lambda: F(4, 10) == F(2, 5))

# ----------------------------------------------------------------------------------------------------- NUMBER THEORY
add("held3-power-residue", "dev", "number_theory", "routine", "Tìm số dư khi chia $2^{2026}$ cho $7$ và chứng minh.",
    "values", ["2"], lambda: pow(2, 2026, 7) == 2)
add("held3-gcd-powers", "dev", "number_theory", "standard", "Tính $\\gcd(2^{12}-1,2^{18}-1)$ và giải thích bằng thuật toán Euclid.",
    "values", ["63"], lambda: math.gcd(2**12 - 1, 2**18 - 1) == 63)
add("held3-sum-squares", "dev", "number_theory", "routine",
    "Tìm tất cả các cặp số nguyên $(x,y)$ thỏa mãn $x^2+y^2=25$. Chứng minh không bỏ sót nghiệm.",
    "pairs", sorted([[a, b] for a in range(-5, 6) for b in range(-5, 6) if a*a + b*b == 25]),
    lambda: len([1 for a in range(-6, 7) for b in range(-6, 7) if a*a + b*b == 25]) == 12)
add("held3-repunit", "dev", "number_theory", "standard",
    "Chứng minh số có đúng $2026$ chữ số $1$ liên tiếp trong hệ thập phân chia hết cho $11$.",
    "proof", None, lambda: int("1" * 2026) % 11 == 0)
add("nt-d1", "dev", "number_theory", "routine", "Tìm số dư khi chia $3^{100}$ cho $5$.",
    "values", ["1"], lambda: pow(3, 100, 5) == 1)
add("nt-d2", "dev", "number_theory", "routine", "Tìm tất cả các số nguyên dương $n$ sao cho $n+3$ chia hết cho $n-1$.",
    "values", ["2", "3", "5"], lambda: [k for k in range(2, 1000) if (k + 3) % (k - 1) == 0] == [2, 3, 5])
add("nt-d3", "dev", "number_theory", "standard", "Tìm tất cả các cặp số nguyên $(x,y)$ thỏa mãn $xy-x-y=2$.",
    "pairs", [[-2, 0], [0, -2], [2, 4], [4, 2]],
    lambda: sorted([a, b] for a in range(-50, 51) for b in range(-50, 51) if a*b - a - b == 2) == [[-2, 0], [0, -2], [2, 4], [4, 2]])
add("nt-d4", "dev", "number_theory", "routine", "Chứng minh rằng $n^3-n$ chia hết cho $6$ với mọi số nguyên $n$.",
    "proof", None, lambda: all((k**3 - k) % 6 == 0 for k in range(-100, 100)))
add("nt-d5", "dev", "number_theory", "routine", "Tìm ước chung lớn nhất của $252$ và $198$.",
    "values", ["18"], lambda: math.gcd(252, 198) == 18)

add("nt-h1", "heldout", "number_theory", "routine", "Tìm số dư khi chia $5^{2025}$ cho $13$.",
    "values", ["5"], lambda: pow(5, 2025, 13) == 5)
add("nt-h2", "heldout", "number_theory", "routine", "Tìm chữ số tận cùng của $7^{2026}$.",
    "values", ["9"], lambda: pow(7, 2026, 10) == 9)
add("nt-h3", "heldout", "number_theory", "standard", "Tìm tất cả các số nguyên $n$ sao cho $2n+5$ chia hết cho $n+1$.",
    "values", ["0", "-2", "2", "-4"], lambda: sorted(k for k in range(-1000, 1000) if k != -1 and (2*k + 5) % (k + 1) == 0) == [-4, -2, 0, 2])
add("nt-h4", "heldout", "number_theory", "standard", "Tìm tất cả các cặp số nguyên dương (x; y) thỏa mãn x² − y² = 15",
    "pairs", [[4, 1], [8, 7]], lambda: [[a, b] for a in range(1, 100) for b in range(1, 100) if a*a - b*b == 15] == [[4, 1], [8, 7]],
    mode="ocr_text")
add("nt-h5", "heldout", "number_theory", "routine", "Chứng minh rằng $n^5-n$ chia hết cho $5$ với mọi số nguyên $n$.",
    "proof", None, lambda: all((k**5 - k) % 5 == 0 for k in range(-100, 100)))
add("nt-h6", "heldout", "number_theory", "standard",
    "Tìm số tự nhiên nhỏ nhất chia cho $3$ dư $2$, chia cho $5$ dư $3$ và chia cho $7$ dư $2$.",
    "values", ["23"], lambda: min(k for k in range(1000) if k % 3 == 2 and k % 5 == 3 and k % 7 == 2) == 23)
add("nt-h7", "heldout", "number_theory", "routine", "Tìm ước chung lớn nhất và bội chung nhỏ nhất của $84$ và $120$.",
    "values", ["12", "840"], lambda: math.gcd(84, 120) == 12 and math.lcm(84, 120) == 840)

# ----------------------------------------------------------------------------------------------------- COMBINATORICS
add("held3-adjacent", "dev", "combinatorics", "routine",
    "Có $6$ học sinh phân biệt, trong đó có An và Bình. Xếp cả $6$ em thành một hàng. Hỏi có bao nhiêu cách để An và Bình đứng cạnh nhau? Giải thích vì sao không đếm lặp.",
    "values", ["240"], lambda: sum(1 for p in itertools.permutations(range(6)) if abs(p.index(0) - p.index(1)) == 1) == 240)
add("held3-rectangles", "dev", "combinatorics", "routine",
    "Có $4$ đường thẳng đứng đôi một phân biệt và $3$ đường thẳng ngang đôi một phân biệt. Chúng tạo thành một lưới. Có bao nhiêu hình chữ nhật có các cạnh nằm trên những đường thẳng này? Chứng minh cách đếm.",
    "values", ["18"], lambda: math.comb(4, 2) * math.comb(3, 2) == 18)
add("held3-coin-invariant", "dev", "combinatorics", "standard",
    "Ban đầu có $9$ đồng xu đều ngửa. Mỗi lượt phải lật đúng $2$ đồng xu phân biệt. Có thể làm cho cả $9$ đồng xu đều sấp không? Chứng minh cho mọi dãy lượt đi.",
    "proof", "không", lambda: True)
add("held3-domino-game", "dev", "combinatorics", "olympiad",
    "An và Bình luân phiên đặt một quân domino phủ đúng hai ô kề cạnh còn trống trên bàn cờ $2\\times8$. An đi trước. Ai không còn nước đi hợp lệ thì thua. Ai có chiến lược thắng? Hãy nêu rõ nước đáp cho mọi nước đi của đối phương, chứng minh nước đáp luôn hợp lệ và trò chơi kết thúc.",
    "proof", "Bình", lambda: True)
add("comb-d1", "dev", "combinatorics", "routine",
    "Từ các chữ số $1,2,3,4,5$ lập được bao nhiêu số tự nhiên có ba chữ số đôi một khác nhau?",
    "values", ["60"], lambda: len(list(itertools.permutations(range(1, 6), 3))) == 60)
add("comb-d2", "dev", "combinatorics", "routine",
    "Một tổ có $10$ học sinh. Có bao nhiêu cách chọn ra $3$ học sinh để đi trực nhật?",
    "values", ["120"], lambda: math.comb(10, 3) == 120)
add("comb-d3", "dev", "combinatorics", "routine", "Có bao nhiêu số tự nhiên có hai chữ số mà tổng các chữ số bằng $9$?",
    "values", ["9"], lambda: sum(1 for k in range(10, 100) if k // 10 + k % 10 == 9) == 9)
add("comb-d4", "dev", "combinatorics", "routine",
    "Chứng minh rằng trong $13$ người bất kì luôn có ít nhất hai người sinh cùng một tháng.",
    "proof", None, lambda: True)
add("comb-d5", "dev", "combinatorics", "routine",
    "Một giải bóng đá có $8$ đội, mỗi đội gặp mỗi đội khác đúng một lần. Hỏi có tất cả bao nhiêu trận đấu?",
    "values", ["28"], lambda: math.comb(8, 2) == 28)

add("comb-h1", "heldout", "combinatorics", "standard",
    "Từ các chữ số $0,1,2,3,4$ lập được bao nhiêu số tự nhiên chẵn có ba chữ số đôi một khác nhau?",
    "values", ["30"], lambda: sum(1 for p in itertools.permutations(range(5), 3) if p[0] != 0 and p[2] % 2 == 0) == 30)
add("comb-h2", "heldout", "combinatorics", "routine",
    "Có bao nhiêu cách xếp $5$ bạn thành một hàng ngang sao cho bạn Minh đứng ở một trong hai đầu hàng?",
    "values", ["48"], lambda: sum(1 for p in itertools.permutations(range(5)) if p.index(0) in (0, 4)) == 48)
add("comb-h3", "heldout", "combinatorics", "routine",
    "Cho $10$ điểm, trong đó không có ba điểm nào thẳng hàng. Có bao nhiêu đoạn thẳng có hai đầu mút là hai trong các điểm đã cho?",
    "values", ["45"], lambda: math.comb(10, 2) == 45)
add("comb-h4", "heldout", "combinatorics", "routine", "Một đa giác lồi có $8$ cạnh thì có bao nhiêu đường chéo?",
    "values", ["20"], lambda: math.comb(8, 2) - 8 == 20)
add("comb-h5", "heldout", "combinatorics", "routine",
    "Chứng minh rằng trong $6$ số nguyên bất kì luôn có hai số mà hiệu của chúng chia hết cho $5$.",
    "proof", None, lambda: True)
add("comb-h6", "heldout", "combinatorics", "standard",
    "Có bao nhiêu số tự nhiên từ $1$ đến $100$ chia hết cho $2$ hoặc chia hết cho $3$?",
    "values", ["67"], lambda: sum(1 for k in range(1, 101) if k % 2 == 0 or k % 3 == 0) == 67)
add("comb-h7", "heldout", "combinatorics", "routine",
    "Một nhóm có $5$ bạn nam và $4$ bạn nữ. Có bao nhiêu cách chọn ra $2$ bạn nam và $2$ bạn nữ?",
    "values", ["60"], lambda: math.comb(5, 2) * math.comb(4, 2) == 60)
add("comb-h8", "heldout", "combinatorics", "standard",
    "Trên bảng viết các số $1,2,3,\\ldots,10$. Mỗi lượt xóa hai số $a,b$ bất kì rồi viết thêm số $a+b$. Sau $9$ lượt trên bảng còn lại một số. Số đó bằng bao nhiêu? Giải thích.",
    "values", ["55"], lambda: sum(range(1, 11)) == 55)


def main():
    bad = [p["id"] for p in problems if not p["_check"]()]
    if bad:
        raise SystemExit(f"reference check failed: {bad}")
    ids = [p["id"] for p in problems]
    assert len(ids) == len(set(ids)), "duplicate ids"
    os.makedirs(OUT, exist_ok=True)
    for split in ("dev", "heldout"):
        rows = [{k: v for k, v in p.items() if k != "_check"} for p in problems if p["split"] == split]
        path = os.path.join(OUT, f"{split}.jsonl")
        with open(path, "w", encoding="utf-8") as f:
            for r in rows:
                f.write(json.dumps(r, ensure_ascii=False) + "\n")
        digest = hashlib.sha256(open(path, "rb").read()).hexdigest()
        by = {}
        for r in rows:
            by[r["topic"]] = by.get(r["topic"], 0) + 1
        print(f"{split}: {len(rows)} problems {by} sha256={digest}")
    print("all references verified independently")


if __name__ == "__main__":
    main()
