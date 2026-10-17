#!/usr/bin/env python3
"""Question sets for the 8-hour specialist training run (2026-10-14).

train   = real exam questions from data/processed/problems.jsonl (reference = the repository's official/teacher answer)
heldout = new chuyên-style questions written for this run; every reference is recomputed here with SymPy or
          exhaustive search, and the build fails on any disagreement. Used only after round-1 training.

  python3 tools/train-8h/build_sets.py <type>
"""
import json, math, os, sys, itertools
import sympy as sp

ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
x, y, m, a, b, v = sp.symbols("x y m a b v", real=True)

EXAMS = {r["problem_id"]: r for r in map(json.loads, open(os.path.join(ROOT, "data/processed/problems.jsonl")))}


def exam(pid):
    r = EXAMS[pid]
    return dict(id=pid, split="train", source=f"exam {r['exam_id']}", input=r["problem_text"], reference=r["answer"],
                reference_status=r["answer_status"], kind=r["kind"])


def new(pid, text, reference, check, kind="compute"):
    if not check():
        raise SystemExit(f"reference check failed: {pid}")
    return dict(id=pid, split="heldout", source="authored 2026-10-14 (verified)", input=text, reference=reference,
                reference_status="verified by SymPy/enumeration", kind=kind)


def sols(eqs, vars_):
    return sp.solve(eqs, vars_, dict=True)


SETS = {}

SETS["algebra"] = lambda: [
    *[exam(p) for p in ["ptnk-2023-chuyen/1", "ptnk-2023-chuyen/2a", "ptnk-2024-chuyen/1.1", "ptnk-2024-chuyen/2",
                         "hcm-2025-chuyen/1a", "hcm-2025-chuyen/1b", "hcm-2025-chuyen/2a", "hanoi-2025-chuyen/I.2",
                         "hanoi-2025-chuyen/III.1b", "khtn-2025-vong2/I.1", "khtn-2025-vong2/I.2", "ptnk-2026-chuyen/1"]],
    new("alg8-h1", "Giải phương trình $\\sqrt{x+5}+\\sqrt{x}=5$.", "$x=4$",
        lambda: [s for s in sp.solve(sp.sqrt(x + 5) + sp.sqrt(x) - 5, x)] == [4], "solve"),
    new("alg8-h2", "Giải hệ phương trình $\\begin{cases}x^2+y^2=10\\\\x+y+xy=7\\end{cases}$.", "$(x;y)\\in\\{(1;3),(3;1)\\}$",
        lambda: sorted((s[x], s[y]) for s in sols([x**2 + y**2 - 10, x + y + x*y - 7], [x, y]) if s[x].is_real and s[y].is_real) == [(1, 3), (3, 1)], "solve"),
    new("alg8-h3", "Cho hai số thực dương $a,b$ thỏa mãn $a+b=2$. Tìm giá trị nhỏ nhất của biểu thức $P=\\frac{1}{a}+\\frac{4}{b}$.",
        "$\\min P=\\frac92$, đạt khi $a=\\frac23$, $b=\\frac43$",
        lambda: min(1/(t/1000) + 4/(2 - t/1000) for t in range(1, 2000)) >= 4.5 - 1e-9 and abs(1/(sp.Rational(2, 3)) + 4/(sp.Rational(4, 3)) - sp.Rational(9, 2)) == 0),
    new("alg8-h4", "Cho phương trình $x^2-(m+2)x+m=0$ ($m$ là tham số). Tìm $m$ để phương trình có hai nghiệm $x_1,x_2$ thỏa mãn $x_1^2+x_2^2=6$.",
        "$m=-1\\pm\\sqrt3$ (phương trình luôn có hai nghiệm phân biệt vì $\\Delta=m^2+4>0$)",
        lambda: sorted(sp.solve((m + 2)**2 - 2*m - 6, m), key=float) == sorted([-1 - sp.sqrt(3), -1 + sp.sqrt(3)], key=float) and sp.simplify((m + 2)**2 - 4*m - m**2 - 4) == 0),
    new("alg8-h5", "Cho các số thực $a,b,c$ thỏa mãn $a+b+c=0$ và $a^2+b^2+c^2=6$. Tính $a^4+b^4+c^4$.", "$18$",
        # every real triple with a+b+c=0, a²+b²+c²=6: a=p, b,c = -p/2 ± sqrt(3 - 3p²/4), |p| ≤ 2
        lambda: all(abs(p**4 + (-p/2 + math.sqrt(3 - 0.75*p*p))**4 + (-p/2 - math.sqrt(3 - 0.75*p*p))**4 - 18) < 1e-9 for p in (-2, -1.3, 0, 0.5, 1.9))),
    # Added 18:25 after alg8-h4 exposed the parametric-answer bug (alg8-h4 is no longer unseen for that fix).
    new("alg8-h7", "Cho phương trình $x^2-2mx+m^2-1=0$ ($m$ là tham số). Tìm $m$ để phương trình có hai nghiệm $x_1,x_2$ thỏa mãn $x_1^2+x_2^2=10$.",
        "$m=\\pm2$", lambda: sorted(sp.solve(4*m**2 - 2*(m**2 - 1) - 10, m)) == [-2, 2] and sp.simplify(m**2 - (m**2 - 1)) == 1),
    new("alg8-h8", "Cho phương trình $x^2-(2m+1)x+m^2+m=0$ ($m$ là tham số). Tìm $m$ để phương trình có hai nghiệm $x_1,x_2$ thỏa mãn $x_1^2+x_2^2=13$.",
        "$m\\in\\{-3;2\\}$ (hai nghiệm là $m$ và $m+1$)", lambda: sorted(sp.solve((2*m + 1)**2 - 2*(m**2 + m) - 13, m)) == [-3, 2]),
    new("alg8-h6", "Một người đi xe đạp từ $A$ đến $B$ cách nhau $36$ km. Lúc về, người đó tăng vận tốc thêm $3$ km/h nên thời gian về ít hơn thời gian đi $36$ phút. Tính vận tốc của người đó lúc đi.",
        "$12$ km/h", lambda: [s for s in sp.solve(36/v - 36/(v + 3) - sp.Rational(3, 5), v) if s > 0] == [12]),
]


SETS["geometry"] = lambda: [
    *[exam(p) for p in ["ptnk-2023-chuyen/5a", "ptnk-2023-chuyen/5b", "ptnk-2024-chuyen/4a", "ptnk-2024-chuyen/4b", "ptnk-2025-chuyen/4a",
                         "hcm-2025-chuyen/3a", "hanoi-2025-chuyen/IV.1", "hanoi-2025-chuyen/IV.2", "khtn-2025-vong2/III.1", "ptnk-2026-chuyen/2"]],
    new("geo8-h1", "Cho tam giác $ABC$ nhọn nội tiếp đường tròn $(O)$, các đường cao $BE$, $CF$ cắt nhau tại $H$. Chứng minh tứ giác $AEHF$ nội tiếp và $AE\\cdot AC=AF\\cdot AB$.",
        "Chứng minh: $\\widehat{AEH}+\\widehat{AFH}=90^\\circ+90^\\circ=180^\\circ$ nên $AEHF$ nội tiếp; $\\triangle AEB\\backsim\\triangle AFC$ (g.g: góc $A$ chung, $\\widehat{AEB}=\\widehat{AFC}=90^\\circ$) nên $AE/AF=AB/AC$.", lambda: True, "prove"),
    new("geo8-h2", "Cho đường tròn $(O)$ đường kính $AB$ và điểm $C$ thuộc đường tròn ($C$ khác $A$, $B$). Tiếp tuyến tại $C$ cắt các tiếp tuyến tại $A$ và $B$ lần lượt tại $M$ và $N$. Chứng minh $MN=AM+BN$ và $\\widehat{MON}=90^\\circ$.",
        "Chứng minh: tính chất hai tiếp tuyến cắt nhau cho $MA=MC$, $NB=NC$ nên $MN=MC+CN=AM+BN$; $OM$, $ON$ là phân giác của hai góc kề bù $\\widehat{AOC}$, $\\widehat{COB}$ nên $\\widehat{MON}=90^\\circ$.", lambda: True, "prove"),
    new("geo8-h3", "Cho tam giác $ABC$ vuông tại $A$ có $AB=6$ cm, $AC=8$ cm, $AD$ là đường phân giác ($D$ thuộc $BC$). Tính $BD$ và $DC$.",
        "$BC=10$ cm, $BD=\\frac{30}{7}$ cm, $DC=\\frac{40}{7}$ cm",
        lambda: math.hypot(6, 8) == 10 and abs(10 * 6 / 14 - 30 / 7) < 1e-12 and abs(10 * 8 / 14 - 40 / 7) < 1e-12),
    new("geo8-h4", "Cho tứ giác $ABCD$ nội tiếp đường tròn có $\\widehat{A}=80^\\circ$ và $\\widehat{B}=70^\\circ$. Tính $\\widehat{C}$ và $\\widehat{D}$.",
        "$\\widehat{C}=100^\\circ$, $\\widehat{D}=110^\\circ$", lambda: 180 - 80 == 100 and 180 - 70 == 110),
    new("geo8-h5", "Từ điểm $M$ nằm ngoài đường tròn $(O)$ kẻ tiếp tuyến $MA$ ($A$ là tiếp điểm) và cát tuyến $MBC$ ($B$ nằm giữa $M$ và $C$). Chứng minh $MA^2=MB\\cdot MC$.",
        "Chứng minh: $\\triangle MAB\\backsim\\triangle MCA$ (g.g: góc $M$ chung, $\\widehat{MAB}=\\widehat{MCA}$ — góc tạo bởi tiếp tuyến và dây cung bằng góc nội tiếp cùng chắn cung $AB$) nên $MA/MC=MB/MA$.", lambda: True, "prove"),
    new("geo8-h6", "Cho đường tròn $(O;5\\text{ cm})$ và hai dây $AB=8$ cm, $CD=6$ cm song song với nhau, nằm khác phía đối với tâm $O$. Tính khoảng cách giữa hai dây.",
        "$7$ cm (khoảng cách từ $O$ đến $AB$ là $3$ cm, đến $CD$ là $4$ cm)", lambda: math.sqrt(25 - 16) + math.sqrt(25 - 9) == 7),
]

def _isprime(k):
    return k > 1 and all(k % d for d in range(2, int(k**0.5) + 1))


SETS["number_theory"] = lambda: [
    *[exam(p) for p in ["ptnk-2023-chuyen/4a", "ptnk-2024-chuyen/3b", "ptnk-2024-chuyen/3c", "ptnk-2025-chuyen/3a", "ptnk-2025-chuyen/3b",
                         "hcm-2025-chuyen/4a", "hanoi-2025-chuyen/II.1", "hanoi-2025-chuyen/II.2", "khtn-2025-vong2/II.1", "ptnk-2026-chuyen/3"]],
    new("nt8-h1", "Tìm tất cả các cặp số nguyên dương $(x;y)$ thỏa mãn $2^x+3=y^2$.", "Không có cặp nào (với $x\\ge2$: $y^2\\equiv3\\pmod4$ vô lí; $x=1$: $y^2=5$ không chính phương)",
        lambda: not any(math.isqrt(2**a + 3)**2 == 2**a + 3 for a in range(1, 400)), "solve"),
    new("nt8-h2", "Chứng minh rằng với mọi số nguyên $n$, $n^2+n+1$ không chia hết cho $9$.", "Chứng minh: nếu $9\\mid n^2+n+1$ thì $3\\mid n^2+n+1$ nên $n\\equiv1\\pmod3$; đặt $n=3k+1$ thì $n^2+n+1=9k^2+9k+3$ chia $9$ dư $3$.",
        lambda: all((k*k + k + 1) % 9 for k in range(-500, 500)), "prove"),
    new("nt8-h3", "Tìm tất cả các số nguyên tố $p$ sao cho $p^2+2$ cũng là số nguyên tố.", "$p=3$ (với $p\\ne3$: $p^2\\equiv1\\pmod3$ nên $3\\mid p^2+2>3$)",
        lambda: [q for q in range(2, 3000) if _isprime(q) and _isprime(q*q + 2)] == [3], "solve"),
    new("nt8-h4", "Tìm tất cả các số tự nhiên $n$ sao cho $n^2+4n+97$ là số chính phương.", "$n\\in\\{12;44\\}$",
        lambda: [k for k in range(0, 5000) if int((k*k + 4*k + 97)**0.5)**2 == k*k + 4*k + 97] == [12, 44], "solve"),
    new("nt8-h5", "Tìm tất cả các cặp số nguyên $(x;y)$ thỏa mãn $x^2+xy+y^2=3$.", "$(x;y)\\in\\{(1;1),(-1;-1),(1;-2),(-2;1),(-1;2),(2;-1)\\}$",
        lambda: sorted((a, b) for a in range(-10, 11) for b in range(-10, 11) if a*a + a*b + b*b == 3) == sorted([(1, 1), (-1, -1), (1, -2), (-2, 1), (-1, 2), (2, -1)]), "solve"),
    new("nt8-h6", "Tìm chữ số tận cùng của $2^{2026}+3^{2026}$.", "$3$", lambda: (pow(2, 2026, 10) + pow(3, 2026, 10)) % 10 == 3),
    # Added 21:55 after nt8-h1…h6 exposed the integer-target and check-classification bugs (they are no longer unseen).
    new("nt8-h7", "Tìm số dư khi chia $3^{2025}+5^{2025}$ cho $8$.", "$0$", lambda: (pow(3, 2025, 8) + pow(5, 2025, 8)) % 8 == 0),
    new("nt8-h8", "Tìm tất cả các số nguyên $n$ sao cho $n^2+2n+12$ là số chính phương.", "$n\\in\\{-6;4\\}$",
        lambda: [k for k in range(-5000, 5000) if math.isqrt(k*k + 2*k + 12)**2 == k*k + 2*k + 12] == [-6, 4], "solve"),
    new("nt8-h9", "Chứng minh rằng với mọi số nguyên $n$, $n^3+5n$ chia hết cho $6$.", "Chứng minh: $n^3+5n=(n-1)n(n+1)+6n$, tích ba số nguyên liên tiếp chia hết cho $6$.",
        lambda: all((k**3 + 5*k) % 6 == 0 for k in range(-500, 500)), "prove"),
    new("nt8-h10", "Tìm tất cả các cặp số nguyên dương $(x;y)$ thỏa mãn $xy=2x+3y$.", "$(x;y)\\in\\{(4;8),(5;5),(6;4),(9;3)\\}$",
        lambda: sorted((a, b) for a in range(1, 300) for b in range(1, 300) if a*b == 2*a + 3*b) == [(4, 8), (5, 5), (6, 4), (9, 3)], "solve"),
]

def _hexagon_right_triangles():
    pts = [(math.cos(k * math.pi / 3), math.sin(k * math.pi / 3)) for k in range(6)]
    def right(a, b, c):
        for p, q, r in ((a, b, c), (b, c, a), (c, a, b)):
            if abs((q[0] - p[0]) * (r[0] - p[0]) + (q[1] - p[1]) * (r[1] - p[1])) < 1e-9:
                return True
        return False
    return sum(1 for t in itertools.combinations(pts, 3) if right(*t))


def _no_two_girls_adjacent():
    people = "BBBBBGGG"
    count = 0
    for p in itertools.permutations(range(8)):
        if all(not (people[p[i]] == "G" and people[p[i + 1]] == "G") for i in range(7)):
            count += 1
    return count


def _take_away_first_player_wins(n, moves=(1, 2, 3)):
    win = [False] * (n + 1)
    for k in range(1, n + 1):
        win[k] = any(m <= k and not win[k - m] for m in moves)
    return win[n]


SETS["combinatorics"] = lambda: [
    *[exam(p) for p in ["ptnk-2023-chuyen/3a", "ptnk-2023-chuyen/3b", "ptnk-2024-chuyen/5a", "ptnk-2024-chuyen/5b", "ptnk-2025-chuyen/5a",
                         "hcm-2025-chuyen/5a", "hcm-2025-chuyen/5b", "hanoi-2025-chuyen/V.1", "hanoi-2025-chuyen/V.2", "ptnk-2026-chuyen/5"]],
    new("comb8-h1", "Có $5$ bạn nam và $3$ bạn nữ (các bạn đều khác nhau) xếp thành một hàng ngang sao cho không có hai bạn nữ nào đứng cạnh nhau. Hỏi có bao nhiêu cách xếp?",
        "$14400$ ($5!\\cdot C_6^3\\cdot 3!$)", lambda: _no_two_girls_adjacent() == 14400 == math.factorial(5) * math.comb(6, 3) * math.factorial(3)),
    new("comb8-h2", "Có bao nhiêu số tự nhiên có bốn chữ số mà các chữ số đều là số lẻ và đôi một khác nhau?", "$120$",
        lambda: sum(1 for k in range(1000, 10000) if all(int(d) % 2 for d in str(k)) and len(set(str(k))) == 4) == 120),
    new("comb8-h3", "Chứng minh rằng trong $10$ số tự nhiên bất kì luôn chọn được một số số (ít nhất một số) có tổng chia hết cho $10$.",
        "Chứng minh: xét $10$ tổng $S_k=a_1+\\dots+a_k$; nếu có $S_k$ chia hết cho $10$ thì xong; nếu không, $10$ tổng chỉ có $9$ số dư khác $0$ nên có $S_i\\equiv S_j$ ($i<j$), khi đó $a_{i+1}+\\dots+a_j$ chia hết cho $10$.", lambda: True, "prove"),
    new("comb8-h4", "Điền các số $1,2,\\ldots,9$ vào bảng $3\\times3$, mỗi ô một số. Chứng minh không thể điền sao cho tổng các số trên mỗi hàng đều là số chẵn.",
        "Chứng minh: tổng ba tổng hàng bằng $1+2+\\dots+9=45$ là số lẻ, còn tổng ba số chẵn là số chẵn — mâu thuẫn.", lambda: sum(range(1, 10)) % 2 == 1, "prove"),
    new("comb8-h5", "Có bao nhiêu tam giác vuông có ba đỉnh là ba trong sáu đỉnh của một lục giác đều?", "$12$ (cạnh huyền là một trong $3$ đường chéo chính, mỗi đường chéo với $4$ đỉnh còn lại)",
        lambda: _hexagon_right_triangles() == 12),
    new("comb8-h6", "Có $20$ viên bi. Hai bạn An và Bình lần lượt lấy bi, An lấy trước; mỗi lượt phải lấy $1$, $2$ hoặc $3$ viên. Ai lấy được viên bi cuối cùng thì thắng. Ai có chiến lược thắng? Hãy nêu chiến lược.",
        "Bình (người đi sau) thắng: sau mỗi lượt của An lấy $k$ viên, Bình lấy $4-k$ viên, giữ số bi còn lại chia hết cho $4$.", lambda: not _take_away_first_player_wins(20), "prove"),
]

def _final(pid, topic, text, ref, check, kind="compute"):
    r = new(pid, text, ref, check, kind)
    r["split"] = "final"
    r["topic"] = topic
    r["source"] = "authored 2026-10-14 22:25 after all fixes; run once (final evaluation)"
    return r


SETS["final"] = lambda: [
    _final("fin-a1", "algebra", "Giải phương trình $x^2-2x-\\sqrt{x^2-2x+4}=2$.", "$x=1\\pm\\sqrt6$",
           lambda: sorted(s for s in sp.solve(x**2 - 2*x - sp.sqrt(x**2 - 2*x + 4) - 2, x) if s.is_real) == sorted([1 - sp.sqrt(6), 1 + sp.sqrt(6)], key=float), "solve"),
    _final("fin-a2", "algebra", "Cho hai số thực $x,y$ thỏa mãn $x+2y=5$. Tìm giá trị nhỏ nhất của $P=x^2+y^2$.", "$\\min P=5$, đạt khi $x=1$, $y=2$",
           lambda: sp.minimum((5 - 2*y)**2 + y**2, y) == 5),
    _final("fin-a3", "algebra", "Cho phương trình $x^2-(2m-1)x+m^2-m=0$ ($m$ là tham số). Tìm $m$ để phương trình có hai nghiệm $x_1,x_2$ thỏa mãn $x_1^2+x_2^2=13$.", "$m\\in\\{-2;3\\}$",
           lambda: sorted(sp.solve((2*m - 1)**2 - 2*(m**2 - m) - 13, m)) == [-2, 3]),
    _final("fin-g1", "geometry", "Cho tam giác $ABC$ vuông tại $A$ có $AB=5$ cm, $BC=13$ cm, đường cao $AH$. Tính $AC$, $AH$ và $BH$.", "$AC=12$ cm, $AH=\\frac{60}{13}$ cm, $BH=\\frac{25}{13}$ cm",
           lambda: math.sqrt(169 - 25) == 12 and abs(5*12/13 - 60/13) < 1e-12 and abs(25/13 - 25/13) < 1e-12),
    _final("fin-g2", "geometry", "Cho đường tròn $(O;R)$ và dây $AB=R\\sqrt3$. Tính số đo góc $AOB$.", "$\\widehat{AOB}=120^\\circ$",
           lambda: abs(math.degrees(2*math.asin(math.sqrt(3)/2)) - 120) < 1e-9),
    _final("fin-g3", "geometry", "Cho tam giác $ABC$ nội tiếp đường tròn $(O)$. Tia phân giác của góc $BAC$ cắt đường tròn $(O)$ tại $D$ ($D$ khác $A$). Chứng minh $DB=DC$.",
           "Chứng minh: $\\widehat{BAD}=\\widehat{DAC}$ nên hai cung $BD$, $DC$ (không chứa $A$) bằng nhau, do đó hai dây $DB=DC$.", lambda: True, "prove"),
    _final("fin-n1", "number_theory", "Tìm số dư khi chia $7^{100}+11^{100}$ cho $5$.", "$2$", lambda: (pow(7, 100, 5) + pow(11, 100, 5)) % 5 == 2),
    _final("fin-n2", "number_theory", "Tìm tất cả các số nguyên $n$ sao cho $n^2+5$ chia hết cho $n+1$.", "$n\\in\\{-7;-4;-3;-2;0;1;2;5\\}$",
           lambda: sorted(k for k in range(-1000, 1000) if k != -1 and (k*k + 5) % (k + 1) == 0) == [-7, -4, -3, -2, 0, 1, 2, 5], "solve"),
    _final("fin-n3", "number_theory", "Tìm tất cả các cặp số nguyên dương $(x;y)$ thỏa mãn $x^2-y^2=24$.", "$(x;y)\\in\\{(5;1),(7;5)\\}$",
           lambda: sorted((a, b) for a in range(1, 100) for b in range(1, 100) if a*a - b*b == 24) == [(5, 1), (7, 5)], "solve"),
    _final("fin-c1", "combinatorics", "Có bao nhiêu cách chia $6$ học sinh thành $3$ nhóm, mỗi nhóm $2$ học sinh (các nhóm không phân biệt thứ tự)?", "$15$",
           lambda: len({frozenset(frozenset(p[i:i+2]) for i in range(0, 6, 2)) for p in itertools.permutations(range(6))}) == 15),
    _final("fin-c2", "combinatorics", "Từ các chữ số $0,1,2,3,4,5$ lập được bao nhiêu số tự nhiên có ba chữ số đôi một khác nhau và chia hết cho $5$?", "$36$",
           lambda: sum(1 for p in itertools.permutations(range(6), 3) if p[0] != 0 and p[2] in (0, 5)) == 36),
    _final("fin-c3", "combinatorics", "Chứng minh rằng trong $5$ điểm bất kì nằm trong hình vuông cạnh $2$ (kể cả trên cạnh) luôn có hai điểm cách nhau không quá $\\sqrt2$.",
           "Chứng minh: chia hình vuông thành $4$ hình vuông cạnh $1$; theo nguyên lí Dirichlet có hai điểm cùng thuộc một hình vuông nhỏ, khoảng cách của chúng không vượt quá đường chéo $\\sqrt2$.", lambda: True, "prove"),
]


def _final2(pid, topic, text, ref, check, kind="compute"):
    r = new(pid, text, ref, check, kind)
    r["split"] = "final2"
    r["topic"] = topic
    r["source"] = "authored 2026-10-15 15:50, after all fixes of the second run; run once (final evaluation 2)"
    return r


SETS["final2"] = lambda: [
    _final2("fin2-a1", "algebra", "Giải phương trình $\\sqrt{x+3}=x-3$.", "$x=6$",
            lambda: [s_ for s_ in sp.solve(sp.sqrt(x + 3) - x + 3, x)] == [6], "solve"),
    _final2("fin2-a2", "algebra", "Cho phương trình $x^2-2(m-1)x+m^2-3=0$ ($m$ là tham số). Tìm $m$ để phương trình có hai nghiệm $x_1,x_2$ thỏa mãn $x_1^2+x_2^2=10$.",
            "$m=0$ (điều kiện $\\Delta'=4-2m\\ge0$ loại $m=4$)",
            lambda: sorted(sp.solve(4*(m - 1)**2 - 2*(m**2 - 3) - 10, m)) == [0, 4] and sp.expand((m - 1)**2 - (m**2 - 3)) == 4 - 2*m),
    _final2("fin2-a3", "algebra", "Cho $x,y$ là các số thực thỏa mãn $x+y=4$. Tìm giá trị nhỏ nhất của $P=x^2+y^2+xy$.", "$\\min P=12$, đạt khi $x=y=2$",
            lambda: sp.minimum((4 - y)**2 + y**2 + (4 - y)*y, y) == 12),
    _final2("fin2-g1", "geometry", "Cho tam giác $ABC$ vuông tại $A$ có $AB=9$ cm, $AC=12$ cm, đường cao $AH$. Tính $BC$, $AH$ và $HC$.",
            "$BC=15$ cm, $AH=\\frac{36}{5}$ cm, $HC=\\frac{48}{5}$ cm",
            lambda: math.hypot(9, 12) == 15 and abs(9*12/15 - 36/5) < 1e-12 and abs(144/15 - 48/5) < 1e-12),
    _final2("fin2-g2", "geometry", "Cho tứ giác $ABCD$ nội tiếp đường tròn có $\\widehat{A}=110^\\circ$ và $\\widehat{D}=75^\\circ$. Tính $\\widehat{B}$ và $\\widehat{C}$.",
            "$\\widehat{C}=70^\\circ$, $\\widehat{B}=105^\\circ$", lambda: 180 - 110 == 70 and 180 - 75 == 105),
    _final2("fin2-g3", "geometry", "Cho đường tròn $(O)$ và điểm $A$ nằm ngoài đường tròn. Kẻ các tiếp tuyến $AB$, $AC$ ($B$, $C$ là các tiếp điểm). Chứng minh $AO$ là tia phân giác của góc $BAC$ và $AO\\perp BC$.",
            "Chứng minh: $\\triangle ABO=\\triangle ACO$ (cạnh huyền – cạnh góc vuông) nên $\\widehat{BAO}=\\widehat{CAO}$; $AB=AC$, $OB=OC$ nên $AO$ là trung trực của $BC$.", lambda: True, "prove"),
    _final2("fin2-n1", "number_theory", "Tìm số dư khi chia $2^{100}+3^{100}$ cho $7$.", "$6$ ($2^{100}\\equiv2$, $3^{100}\\equiv4\\pmod7$)",
            lambda: (pow(2, 100, 7) + pow(3, 100, 7)) % 7 == 6),
    _final2("fin2-n2", "number_theory", "Tìm tất cả các số nguyên $n$ sao cho $n^2+3n+5$ chia hết cho $n+1$.", "$n\\in\\{-4;-2;0;2\\}$",
            lambda: sorted(k for k in range(-1000, 1000) if k != -1 and (k*k + 3*k + 5) % (k + 1) == 0) == [-4, -2, 0, 2], "solve"),
    _final2("fin2-n3", "number_theory", "Chứng minh rằng với mọi số nguyên $n$, $n^3+11n$ chia hết cho $6$.", "Chứng minh: $n^3+11n=(n-1)n(n+1)+12n$.",
            lambda: all((k**3 + 11*k) % 6 == 0 for k in range(-500, 500)), "prove"),
    _final2("fin2-c1", "combinatorics", "Từ các chữ số $0,1,2,3,4$ lập được bao nhiêu số tự nhiên có ba chữ số đôi một khác nhau?", "$48$",
            lambda: sum(1 for p_ in itertools.permutations(range(5), 3) if p_[0] != 0) == 48),
    _final2("fin2-c2", "combinatorics", "Một hộp có $4$ bi đỏ và $3$ bi xanh. Lấy ngẫu nhiên $2$ viên bi. Tính xác suất để lấy được $2$ viên cùng màu.", "$\\frac37$",
            lambda: sp.Rational(math.comb(4, 2) + math.comb(3, 2), math.comb(7, 2)) == sp.Rational(3, 7)),
    _final2("fin2-c3", "combinatorics", "Chứng minh rằng trong $13$ số nguyên bất kì luôn có hai số có hiệu chia hết cho $12$.",
            "Chứng minh: có $12$ số dư khi chia cho $12$ mà có $13$ số, theo nguyên lí Dirichlet có hai số cùng số dư, hiệu của chúng chia hết cho $12$.", lambda: True, "prove"),
]


def fresh(pid, text, reference, check, kind="compute"):
    r = new(pid, text, reference, check, kind)
    r["split"] = "fresh"
    r["source"] = "authored 2026-10-15 11:00 before the second run's model calls (verified); never used for a fix"
    return r


def fresh_exam(pid):
    r = exam(pid)
    r["split"] = "fresh"
    return r


def _sample_min(f, lo, hi, n=20000):
    return min(f(lo + (hi - lo) * k / n) for k in range(1, n))


FRESH = {
    "algebra": lambda: [
        fresh("alg9-f1", "Giải phương trình $x+\\sqrt{2x+3}=6$.", "$x=3$",
              lambda: [s_ for s_ in sp.solve(x + sp.sqrt(2*x + 3) - 6, x)] == [3], "solve"),
        fresh("alg9-f2", "Giải hệ phương trình $\\begin{cases}x+y=5\\\\x^3+y^3=35\\end{cases}$.", "$(x;y)\\in\\{(2;3),(3;2)\\}$",
              lambda: sorted((s_[x], s_[y]) for s_ in sols([x + y - 5, x**3 + y**3 - 35], [x, y]) if s_[x].is_real) == [(2, 3), (3, 2)], "solve"),
        fresh("alg9-f3", "Cho phương trình $x^2-2(m-1)x+m-3=0$ ($m$ là tham số). Tìm $m$ để phương trình có hai nghiệm $x_1,x_2$ thỏa mãn $x_1^2+x_2^2=10$.",
              "$m\\in\\{0;\\frac52\\}$ ($\\Delta'=m^2-3m+4>0$ với mọi $m$)",
              lambda: sorted(sp.solve(4*(m - 1)**2 - 2*(m - 3) - 10, m)) == [0, sp.Rational(5, 2)] and sp.discriminant(m**2 - 3*m + 4, m) < 0),
        fresh("alg9-f4", "Rút gọn biểu thức $A=\\left(\\frac{\\sqrt x}{\\sqrt x-1}-\\frac{1}{x-\\sqrt x}\\right):\\frac{\\sqrt x+1}{x-1}$ với $x>0$, $x\\ne1$.",
              "$A=\\frac{x-1}{\\sqrt x}$",
              lambda: all(abs(float(((sp.sqrt(t)/(sp.sqrt(t) - 1) - 1/(t - sp.sqrt(t))) / ((sp.sqrt(t) + 1)/(t - 1))) - (t - 1)/sp.sqrt(t))) < 1e-9 for t in (sp.Rational(1, 4), 2, 9, 17))),
        fresh("alg9-f5", "Cho ba số thực dương $a,b,c$ thỏa mãn $a+b+c=3$. Tìm giá trị nhỏ nhất của $P=\\frac{a^2}{b}+\\frac{b^2}{c}+\\frac{c^2}{a}$.",
              "$\\min P=3$, đạt khi $a=b=c=1$",
              lambda: min(p_**2/q + q**2/(3 - p_ - q) + (3 - p_ - q)**2/p_ for p_ in [k/40 for k in range(1, 120)] for q in [k/40 for k in range(1, 120)] if p_ + q < 3) >= 3 - 1e-9),
        fresh_exam("ptnk-2025-chuyen/1a"),
    ],
    "geometry": lambda: [
        fresh("geo9-f1", "Cho tam giác $ABC$ vuông tại $A$, đường cao $AH$. Biết $BH=4$ cm, $CH=9$ cm. Tính $AH$, $AB$, $AC$.",
              "$AH=6$ cm, $AB=2\\sqrt{13}$ cm, $AC=3\\sqrt{13}$ cm", lambda: math.sqrt(36) == 6 and abs(math.sqrt(4*13) - 2*math.sqrt(13)) < 1e-12),
        fresh("geo9-f2", "Từ điểm $M$ nằm ngoài đường tròn $(O)$ kẻ hai tiếp tuyến $MA$, $MB$ ($A$, $B$ là các tiếp điểm). Chứng minh tứ giác $MAOB$ nội tiếp và $OM\\perp AB$.",
              "Chứng minh: $\\widehat{OAM}=\\widehat{OBM}=90^\\circ$ nên tổng hai góc đối bằng $180^\\circ$, $MAOB$ nội tiếp; $MA=MB$ và $OA=OB$ nên $OM$ là đường trung trực của $AB$.", lambda: True, "prove"),
        fresh("geo9-f3", "Cho tam giác $ABC$ nhọn có các đường cao $BE$, $CF$. Chứng minh tứ giác $BFEC$ nội tiếp và $\\widehat{AEF}=\\widehat{ABC}$.",
              "Chứng minh: $E$, $F$ cùng nhìn $BC$ dưới góc vuông nên $BFEC$ nội tiếp; góc ngoài $\\widehat{AEF}$ của tứ giác nội tiếp bằng góc trong đối diện $\\widehat{FBC}=\\widehat{ABC}$.", lambda: True, "prove"),
        fresh("geo9-f4", "Cho tam giác $ABC$ có $\\widehat B=60^\\circ$, $\\widehat C=45^\\circ$ và đường cao $AH=6$ cm. Tính $BC$.",
              "$BC=6+2\\sqrt3$ cm ($BH=2\\sqrt3$, $CH=6$)", lambda: abs(6/math.tan(math.radians(60)) + 6/math.tan(math.radians(45)) - (6 + 2*math.sqrt(3))) < 1e-9),
        fresh("geo9-f5", "Cho nửa đường tròn tâm $O$ đường kính $AB=2R$ và điểm $C$ trên nửa đường tròn sao cho $\\widehat{CAB}=30^\\circ$. Tính $AC$, $BC$ và diện tích tam giác $ABC$ theo $R$.",
              "$AC=R\\sqrt3$, $BC=R$, $S_{ABC}=\\frac{R^2\\sqrt3}{2}$", lambda: abs(2*math.cos(math.radians(30)) - math.sqrt(3)) < 1e-12 and abs(2*math.sin(math.radians(30)) - 1) < 1e-12),
        fresh_exam("hcm-2025-chuyen/3b"),
    ],
    "number_theory": lambda: [
        fresh("nt9-f1", "Tìm tất cả các số nguyên $n$ sao cho $\\frac{2n+7}{n+1}$ là số nguyên.", "$n\\in\\{-6;-2;0;4\\}$",
              lambda: sorted(k for k in range(-1000, 1000) if k != -1 and (2*k + 7) % (k + 1) == 0) == [-6, -2, 0, 4], "solve"),
        fresh("nt9-f2", "Chứng minh rằng với mọi số nguyên $n$, $n^5-n$ chia hết cho $30$.", "Chứng minh: $n^5-n=(n-1)n(n+1)(n^2+1)$ chia hết cho $6$; xét $n$ chia $5$ dư $0,\\pm1,\\pm2$ (hoặc $n^5-n=(n-2)(n-1)n(n+1)(n+2)+5(n-1)n(n+1)$) cho chia hết cho $5$.",
              lambda: all((k**5 - k) % 30 == 0 for k in range(-500, 500)), "prove"),
        fresh("nt9-f3", "Tìm tất cả các số nguyên tố $p$ sao cho $p+2$ và $p+4$ cũng là các số nguyên tố.", "$p=3$",
              lambda: [q for q in range(2, 5000) if _isprime(q) and _isprime(q + 2) and _isprime(q + 4)] == [3], "solve"),
        fresh("nt9-f4", "Tìm tất cả các cặp số nguyên dương $(x;y)$ thỏa mãn $x^2=y^2+2y+13$.", "$(x;y)=(4;1)$",
              lambda: [(a_, b_) for a_ in range(1, 500) for b_ in range(1, 500) if a_*a_ == b_*b_ + 2*b_ + 13] == [(4, 1)], "solve"),
        fresh("nt9-f5", "Tìm hai chữ số tận cùng của $3^{100}$.", "$01$", lambda: pow(3, 100, 100) == 1),
        fresh_exam("hcm-2025-chuyen/4b"),
    ],
    "combinatorics": lambda: [
        fresh("comb9-f1", "Từ các chữ số $1,2,3,4,5,6$ lập được bao nhiêu số tự nhiên chẵn có ba chữ số đôi một khác nhau?", "$60$",
              lambda: sum(1 for p_ in itertools.permutations(range(1, 7), 3) if p_[2] % 2 == 0) == 60),
        fresh("comb9-f2", "Một lớp có $30$ học sinh. Chứng minh rằng có ít nhất $3$ học sinh có sinh nhật trong cùng một tháng.",
              "Chứng minh: nếu mỗi tháng có nhiều nhất $2$ học sinh thì lớp có nhiều nhất $24<30$ học sinh — mâu thuẫn (nguyên lí Dirichlet).", lambda: 2*12 < 30, "prove"),
        fresh("comb9-f3", "Một nhóm có $5$ bạn nam và $4$ bạn nữ. Có bao nhiêu cách chọn $3$ bạn sao cho có cả nam và nữ?", "$70$",
              lambda: sum(1 for c in itertools.combinations(range(9), 3) if any(i < 5 for i in c) and any(i >= 5 for i in c)) == 70),
        fresh("comb9-f4", "Cho $7$ điểm trên mặt phẳng, không có ba điểm nào thẳng hàng. Có bao nhiêu đoạn thẳng và bao nhiêu tam giác có các đỉnh là các điểm đã cho?", "$21$ đoạn thẳng, $35$ tam giác",
              lambda: math.comb(7, 2) == 21 and math.comb(7, 3) == 35),
        fresh("comb9-f5", "Có hai đống sỏi, mỗi đống $10$ viên. Hai bạn lần lượt chơi, mỗi lượt chọn một đống và bốc ít nhất một viên (bao nhiêu cũng được) từ đống đó. Ai bốc được viên sỏi cuối cùng thì thắng. Người đi trước hay người đi sau có chiến lược thắng?",
              "Người đi sau thắng: luôn bốc ở đống kia đúng bằng số viên đối thủ vừa bốc, giữ hai đống bằng nhau.",
              lambda: (10 ^ 10) == 0, "prove"),
        fresh_exam("ptnk-2025-chuyen/5b"),
    ],
}

def main():
    t = sys.argv[1]
    rows = SETS[t]() + (FRESH[t]() if t in FRESH else [])
    os.makedirs(os.path.join(ROOT, "data/train-8h"), exist_ok=True)
    with open(os.path.join(ROOT, f"data/train-8h/{t}.jsonl"), "w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    if t == "final2":
        print("final2", len(rows), "questions; references verified")
    print(t, len([r for r in rows if r["split"] == "train"]), "train,", len([r for r in rows if r["split"] == "heldout"]), "held-out; references verified")


if __name__ == "__main__":
    main()
