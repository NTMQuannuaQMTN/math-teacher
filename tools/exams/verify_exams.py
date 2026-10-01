"""
Independent verification of the chuyên exam answers in catalog.py — by computation, never by a model.

  python3 tools/exams/verify_exams.py            # prints one line per check, writes data/exams/verification.json

Methods: SymPy (exact algebra), exhaustive search (finite combinatorics), brute force over large ranges
(number theory), dense random sampling of the constraint set (inequalities to prove). A sampled inequality
or a bounded search is evidence, not a proof: those checks are labelled "sampled"/"bounded" in the output.
Geometry proofs and strategy games are not checked here (manual review).
"""
import itertools
import json
import math
import random
import sys
from fractions import Fraction as F
from pathlib import Path

import sympy as sp

random.seed(20261001)
RESULTS = []


def check(vid, claim, ok, method):
    RESULTS.append(dict(verify=vid, claim=claim, ok=bool(ok), method=method))


x, y, z, m = sp.symbols("x y z m", real=True)

# ---- PTNK 2023
sol = sp.solve([(x + y) * (4 + 1 / (x * y)) - 1, (4 * x + 1 / x) * (4 * y + 1 / y) + 20], [x, y], dict=True)
got = {(s[x], s[y]) for s in sol}
want = {(1, sp.Rational(-1, 2)), (sp.Rational(1, 4), sp.Rational(-1, 2)), (sp.Rational(-1, 2), 1), (sp.Rational(-1, 2), sp.Rational(1, 4))}
check("ptnk2023_1", "system has exactly the 4 official solutions", got == want, "exact (SymPy)")


def sample_abc_reciprocal():
    # positive a, b, c with 1/a + 1/b + 1/c = 1
    p = [random.random() + 1e-3 for _ in range(3)]
    s = sum(p)
    return [s / v for v in p]


ok_a = ok_b = True
for _ in range(200_000):
    a, b, c = sample_abc_reciprocal()
    ok_a &= 1 / math.sqrt(a) + 1 / math.sqrt(b) + 1 / math.sqrt(c) <= math.sqrt(3) + 1e-12
    ok_b &= (math.sqrt(a) + math.sqrt(b) + math.sqrt(c)) ** 2 <= a * b * c * (1 + 1e-12) and a * b * c <= (a + b + c) ** 2 / 3 * (1 + 1e-12)
check("ptnk2023_2", "2a: sum 1/sqrt <= sqrt3 on 200k samples of ab+bc+ca=abc", ok_a, "sampled")
check("ptnk2023_2", "2b: (sum sqrt)^2 <= abc <= (a+b+c)^2/3 on 200k samples", ok_b, "sampled")

xs, best_col, best_row = set(), -1, -1
for bits in range(1 << 16):
    g = [[(bits >> (4 * r + c)) & 1 for c in range(4)] for r in range(4)]
    rows = [sum(r) for r in g]
    cols = [sum(g[r][c] for r in range(4)) for c in range(4)]
    if len(set(rows)) != 1 or len(set(cols)) != 4:
        continue
    xs.add(rows[0])
    best_col = max(best_col, sum(g[r][c] != g[r + 1][c] for r in range(3) for c in range(4)))
    best_row = max(best_row, sum(g[r][c] != g[r][c + 1] for r in range(4) for c in range(3)))
check("ptnk2023_3", "3a: every valid colouring has 2 black cells per row", xs == {2}, "exhaustive (2^16 colourings)")
check("ptnk2023_3", "3b: max good pairs = 4 by columns, 11 by rows", (best_col, best_row) == (4, 11), "exhaustive (2^16 colourings)")

odd, ks, square = True, set(), False
for mm in range(1, 200_000):
    n = mm * mm - 1
    a = n * n - mm
    odd &= a % 2 == 1
    if a > 1 and (a - 1) % 3 == 0 and ((a - 1) // 3) & ((a - 1) // 3 - 1) == 0:
        ks.add(((a - 1) // 3).bit_length() - 1)
    if a >= 0 and math.isqrt(a) ** 2 == a:
        square = True
check("ptnk2023_4", "4a: a odd for all m < 200000", odd, "bounded search")
check("ptnk2023_4", "4b: a = 3*2^k+1 only for k = 1 (m < 200000)", ks == {1}, "bounded search")
check("ptnk2023_4", "4c: a never a perfect square (m < 200000)", not square, "bounded search")

# ---- PTNK 2024
sol = sp.solve([x**3 + z**3 - y, y**3 + x**3 - z, z**3 + y**3 - x], [x, y, z], dict=True)
real = {(s[x], s[y], s[z]) for s in sol if all(v.is_real for v in s.values())}
r = 1 / sp.sqrt(2)
check("ptnk2024_1", "1.1: real solutions are x=y=z in {0, ±1/√2}", real == {(0, 0, 0), (r, r, r), (-r, -r, -r)}, "exact (SymPy)")
X = sp.symbols("X")
exc = []
for A in range(1, 41):
    for B in range(1, 41):
        if A == B:
            continue
        roots = {sp.Integer(1)} | {t for t in sp.solve(X**2 - 2 * (A + B) * X + A * B + 2, X) if t.is_real and t >= 0}
        if len(roots) != 3:
            exc.append((A, B))
check("ptnk2024_1", "1.2: exactly 3 roots for all distinct a, b <= 40", not exc, "bounded search (exact roots)")
ok = True
for _ in range(100_000):
    # a, b, c >= 0 with a^2+b^2+c^2+3 = 2(ab+bc+ca): solve for c given a, b
    a, b = random.uniform(0, 10), random.uniform(0, 10)
    # c^2 - 2(a+b)c + (a^2+b^2+3-2ab) = 0
    disc = (a + b) ** 2 - (a * a + b * b + 3 - 2 * a * b)
    if disc < 0:
        continue
    for c in ((a + b) + math.sqrt(disc), (a + b) - math.sqrt(disc)):
        if c < 0:
            continue
        s, q = a + b + c, a * b + b * c + c * a
        ok &= s >= 3 - 1e-9 and s <= (2 * q + 3) / 3 + 1e-9
check("ptnk2024_2", "3 <= a+b+c <= (2(ab+bc+ca)+3)/3 on 100k constraint samples", ok, "sampled")
seq = [2, 4]
for _ in range(400):
    seq.append(4 * seq[-1] - seq[-2])
n_ = sp.symbols("n", integer=True, nonnegative=True)
an = (2 + sp.sqrt(3)) ** n_ + (2 - sp.sqrt(3)) ** n_
check("ptnk2024_3", "3a: closed form satisfies a_{n+2} = 4a_{n+1} - a_n (n < 30)", all(sp.simplify(sp.expand(an.subs(n_, k + 2) - 4 * an.subs(n_, k + 1) + an.subs(n_, k))) == 0 for k in range(30)), "exact (SymPy)")
check("ptnk2024_3", "3b: 4 | a_n iff n odd (n < 400)", all((seq[k] % 4 == 0) == (k % 2 == 1) for k in range(400)), "bounded search (exact integers)")
check("ptnk2024_3", "3c: 14 | a_n iff n ≡ 2 (mod 4) (n < 400)", all((seq[k] % 14 == 0) == (k % 4 == 2) for k in range(400)), "bounded search (exact integers)")
check("ptnk2024_5", "5a: a_i = 225 + i attains a_1 = 226", sum(range(226, 242)) > sum(range(242, 257)), "exact")
N = 31
SQ = {k * k for k in range(2, 9)}
E = [(i, j) for i in range(1, N + 1) for j in range(i + 1, N + 1) if i + j in SQ]
adj = {i: set() for i in range(1, N + 1)}
for i, j in E:
    adj[i].add(j)
    adj[j].add(i)


def two_disjoint_edges(S):
    es = [(i, j) for i, j in E if i in S and j in S]
    return any(not ({a, b} & {c, d}) for (a, b), (c, d) in itertools.combinations(es, 2))


count = viol = 0


def rec(v, ind):
    global count, viol
    if v > N:
        count += 1
        viol += not two_disjoint_edges(set(range(1, N + 1)) - ind)
        return
    rec(v + 1, ind)
    if not (adj[v] & ind):
        rec(v + 1, ind | {v})


rec(1, frozenset())
check("ptnk2024_5", f"5b: all {count} square-sum-free boxes leave two disjoint square pairs in the other", viol == 0, "exhaustive")

# ---- PTNK 2025
S, P = 2 * (m + 1), 2 * m
f = sp.expand((S**2 - 2 * P) ** 2 - 2 * P**2)
fmin = min(float(f.subs(m, t)) for t in [i / 1000 for i in range(-5000, 5000)])
check("ptnk2025_1", "1a: Δ' = m^2 + 1 > 0", sp.expand((m + 1) ** 2 - 2 * m) == m**2 + 1, "exact (SymPy)")
check("ptnk2025_1", f"1b: x1^4 + x2^4 > 9/2 (min ≈ {fmin:.3f} over m ∈ [-5, 5])", fmin > 4.5, "sampled")
ok = True
for t in [i / 37 for i in range(-200, 200)]:
    r1, r2 = sp.Poly(X**2 - 2 * (t + 1) * X + 2 * t, X).nroots()
    v = float((r1 + sp.sqrt(r1**2 + 1)) * (r2 + sp.sqrt(r2**2 + 1)))
    ok &= (abs(v - 1) < 1e-9) == (abs(t + 1) < 1e-12)
ok &= abs(float(sp.prod([(r_ + sp.sqrt(r_**2 + 1)) for r_ in sp.Poly(X**2 - 2 * 0 * X - 2, X).nroots()])) - 1) < 1e-12
check("ptnk2025_1", "1c: product = 1 exactly at m = -1 (grid of m + m = -1)", ok, "sampled")
t = sp.symbols("t", real=True)
best = None
for s1, s2, s3 in itertools.permutations([1, 2, 3]):
    a, b = -t, t
    c = s1 - b
    d = s2 - c
    if sp.simplify(d + a - s3) != 0:
        continue
    Q = sp.expand(a**2 + b**2 + c**2 + d**2)
    t0 = sp.solve(sp.diff(Q, t), t)[0]
    vals = [v.subs(t, t0) for v in (a, b, c, d)]
    if len(set(vals)) == 4 and (best is None or Q.subs(t, t0) < best[0]):
        best = (Q.subs(t, t0), vals)
check("ptnk2025_2", "2: minimum sum of squares 19/4 at (1/4, -1/4, 5/4, 7/4) (up to symmetry)", best is not None and best[0] == sp.Rational(19, 4), "exact (SymPy, all edge assignments)")
sols = [(a, b) for a in range(1, 5000) for b in range(1, 400) if (a * a + a + b * b) % (a * b) == 0]
check("ptnk2025_3", "3a: no solution with n = 3 (m < 5000)", not [s for s in sols if s[1] == 3], "bounded search")
check("ptnk2025_3", "3b: n | m gives exactly (1,1), (4,2) (m < 5000, n < 400)", {s for s in sols if s[0] % s[1] == 0} == {(1, 1), (4, 2)}, "bounded search")
check("ptnk2025_3", "3c: m = gcd(m,n)^2 for every solution found", all(s[0] == math.gcd(*s) ** 2 for s in sols), "bounded search")

# ---- TP.HCM 2025
ok = all(abs(math.hypot(4 * a + 5, 3 * math.sqrt(a * a - 1)) - math.hypot(4 * a - 5, 3 * math.sqrt(a * a - 1)) - 8) < 1e-9 for a in [1 + i / 100 for i in range(1, 2000)])
check("hcm2025_1", "1a: P = 8 for all a > 1 with b = sqrt(a^2-1)", ok, "sampled")
a, c = sp.symbols("a c", real=True)
sol = [s for s in sp.solve([a**2 - 4 * a + c, 11 * a**2 + a + 2 * c], [a, c], dict=True) if s[c] != 0]
b_ = 4 - sol[0][a]
check("hcm2025_1", "1b: a=-1, b=5, c=-5 and the value is -1", len(sol) == 1 and sol[0][a] ** 2025 + b_**2025 + sol[0][c] ** 2025 == -1, "exact (SymPy)")
xx = sp.symbols("xx", positive=True)
area = (2 - 3 * xx) * xx * sp.sqrt(3) / 4
check("hcm2025_2", "2b: area maximal at x = 1/3", sp.solve(sp.diff(area, xx), xx) == [sp.Rational(1, 3)], "exact (SymPy)")
# 2a: x = distance of the truck at 14h, car 2x; at 15h car 2x - a, truck |x - a|
ok = sp.solve(sp.Eq(2 * xx - 1, 2 * (1 - xx)), xx) == [sp.Rational(3, 4)]
check("hcm2025_2", "2a: truck 3a/4 km away at 14:00 → arrives 14:45 (a normalised to 1)", ok, "exact (SymPy)")
beautiful = {a * a + 7 * b * b for a in range(0, 200) for b in range(0, 80)}
check("hcm2025_4", "4a: two-digit beautiful multiples of 11 are 11, 44, 77, 88, 99", [n for n in range(10, 100) if n % 11 == 0 and n in beautiful] == [11, 44, 77, 88, 99], "exhaustive")
check("hcm2025_4", "4b: n beautiful and 11 | n ⇒ n/11 beautiful (n < 20000)", all((n // 11) in beautiful for n in range(11, 20000, 11) if n in beautiful), "bounded search")
good = [a for a in range(-100, 101) if (lambda d: d >= 0 and math.isqrt(d) ** 2 == d and (a + math.isqrt(d)) % 2 == 0)(a * a - 8 * a - 40)]
check("hcm2025_5", "5a: a ∈ {-11,-5,13,19}, probability 4/201", good == [-11, -5, 13, 19] and F(len(good), 201) == F(4, 201), "exhaustive")

# ---- Hà Nội 2025
check("hanoi2025_1", "I.1: 4 girls keep the ratio 20/50", F(20, 50) == F(20 + 4, 56 + 4) and all(F(20, 50) != F(20 + g, 56 + g) for g in range(0, 200) if g != 4), "exhaustive")
a, b, c = sp.symbols("a b c")
Pexpr = 1 / (a**2 - b * c) + 1 / (b**2 - c * a) + 1 / (c**2 - a * b)
check("hanoi2025_1", "I.2: P = 0 when ab+bc+ca = 0", sp.simplify(Pexpr.subs(c, sp.solve(a * b + b * c + c * a, c)[0])) == 0, "exact (SymPy)")
pairs = [(X_, Y_) for X_ in range(-400, 401) for Y_ in range(-400, 401) if 2 * (2 * X_ - Y_) * (Y_ - X_) ** 2 == 15 * X_ - 7 * Y_ + 7]
check("hanoi2025_2", "II.2: integer solutions (|x|,|y| <= 400) are (-7,-14), (-2,-3), (4,7)", pairs == [(-7, -14), (-2, -3), (4, 7)], "bounded search")
check("hanoi2025_3", "III.1a: ab²+bc²+ca²-a²b-b²c-c²a = (a-b)(b-c)(c-a)", sp.expand(a * b**2 + b * c**2 + c * a**2 - a**2 * b - b**2 * c - c**2 * a - (a - b) * (b - c) * (c - a)) == 0, "exact (SymPy)")
best = 1e9
for _ in range(300_000):
    u, v = random.uniform(-10, 10), random.uniform(-10, 10)
    w = -(u + v)
    prod = u * v * w
    if prod <= 0:
        continue
    k = (16 / prod) ** (1 / 3)
    u, v = u * k, v * k
    A_, B_, C_ = (2 * u + v) / 3, (v - u) / 3, -(u + 2 * v) / 3
    best = min(best, A_ * A_ + B_ * B_ + C_ * C_)
check("hanoi2025_3", f"III.1b: min a²+b²+c² = 8 (sampled min {best:.6f}; attained at (-2,0,2))", abs(best - 8) < 1e-3 and (-2 - 0) * (0 - 2) * (2 + 2) == 16, "sampled + exact witness")
found = set()
for d1 in range(1, 30):
    for n1 in range(1, 120):
        mm_ = F(n1, d1)
        for d2 in range(1, 30):
            for n2 in range(1, 120):
                nn_ = F(n2, d2)
                if (mm_ / nn_).denominator == 1 and (mm_ + nn_ + mm_ * nn_).denominator == 1 and (1 / mm_ + 1 / nn_ + 1 / (mm_ * nn_)).denominator == 1:
                    found.add((mm_, nn_))
check("hanoi2025_4", "III.2: exactly 5 pairs among fractions with numerators < 120, denominators < 30", found == {(F(1), F(1)), (F(1), F(1, 2)), (F(2), F(1)), (F(2), F(1, 3)), (F(3), F(1, 2))}, "bounded search")
sizes = [(A_, 4 * A_ // 3) for A_ in range(1, 81) if A_ % 2 == 0 and (4 * A_) % 3 == 0 and A_ + 4 * A_ // 3 <= 80]
check("hanoi2025_5", "V.1: |A| = 25 impossible (needs 3 | |A|)", (4 * 25) % 3 != 0, "exact")
check("hanoi2025_5", "V.2: largest total satisfying the counting conditions is 70 (30 + 40)", max(A_ + B_ for A_, B_ in sizes) == 70, "exhaustive (necessary conditions; construction by hand)")

# ---- KHTN 2025
fq = lambda v: (v + 1) ** 0.25 + (3 * v * v - 2 * v + 1) ** 0.25 - (2 * v * v - v + 1) ** 0.25 - (v * v + 1) ** 0.25
grid = [-1 + i * 0.0005 for i in range(int(61 / 0.0005))]
vals = [fq(v) for v in grid]
# f <= 0 everywhere and only touches 0, so its zeros are the local maxima that reach 0 (a sign-change search finds none)
peaks = sorted({round(grid[i], 2) for i in range(1, len(grid) - 1) if vals[i] >= vals[i - 1] and vals[i] >= vals[i + 1] and vals[i] > -1e-9})
check("khtn2025_1", f"I.1: zeros on [-1, 60] are x = 0 and x = 1 (f <= 0 elsewhere; peaks at {peaks})", fq(0.0) == 0 and abs(fq(1.0)) < 1e-15 and peaks == [0.0, 1.0] and max(vals) <= 1e-12, "sampled + exact substitution")
sol = sp.solve([x + y + x * y - 3, 1 + 12 * (x + y) - 7 * y**3 - 6 * x * y * (y + 3 - x * y)], [x, y], dict=True)
check("khtn2025_1", "I.2: the only real solution is (1, 1)", {(s[x], s[y]) for s in sol if s[x].is_real and s[y].is_real} == {(1, 1)}, "exact (SymPy)")
pairs = [(X_, Y_) for X_ in range(1, 40) for Y_ in range(1, 90) if 25**Y_ + (4**X_ + 1) * (4 * X_ * X_ + 3 * X_ + 3) == (4**X_ + 4 * X_ * X_ + 3 * X_ + 4) * 5**Y_]
check("khtn2025_2", "II.1: positive solutions (x < 40, y < 90) are (1,1), (2,2)", pairs == [(1, 1), (2, 2)], "bounded search")
ok = True
for _ in range(200_000):
    X_, Y_, Z_ = (random.uniform(1, 2) for _ in range(3))
    L = (X_**3 / Y_**3 + Y_**3 / Z_**3 + Z_**3 / X_**3) * (X_**3 / (X_**3 + 8 * Z_**3) + Y_**3 / (Y_**3 + 8 * X_**3) + Z_**3 / (Z_**3 + 8 * Y_**3))
    R = 3 * X_ * Y_ / (Z_**2 + 8 * X_ * Y_) + 3 * Y_ * Z_ / (X_**2 + 8 * Y_ * Z_) + 3 * Z_ * X_ / (Y_**2 + 8 * Z_ * X_)
    ok &= L >= R - 1e-12
check("khtn2025_3", "II.2: inequality holds on 200k samples of (1,2)^3", ok, "sampled")
r2 = sp.sqrt(2)
M = [1 + r2, -1 + r2, 2 - r2, -2 - r2]
ok = all(sp.nsimplify(sp.expand(v**2)).is_rational is False for v in M)
for p_, q_ in itertools.combinations(M, 2):
    s_, t_ = sp.nsimplify(sp.expand(p_ + q_)), sp.nsimplify(sp.expand(p_ * q_))
    ok &= s_ != 0 and t_ != 0 and (s_.is_rational != t_.is_rational)
check("khtn2025_4", "IV: the 4-element example is a special set (upper bound 4: argument, manual review)", ok, "exact (SymPy) for the example")

failed = [r for r in RESULTS if not r["ok"]]
for r in RESULTS:
    print(f"{'OK  ' if r['ok'] else 'FAIL'} {r['verify']:<12} [{r['method']}] {r['claim']}")
out = Path(__file__).resolve().parents[2] / "data" / "exams" / "verification.json"
out.write_text(json.dumps(RESULTS, ensure_ascii=False, indent=1))
print(f"{len(RESULTS) - len(failed)}/{len(RESULTS)} checks passed → {out}")
sys.exit(1 if failed else 0)
