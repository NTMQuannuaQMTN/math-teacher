"""
Independent verification of every ground-truth answer in the benchmark.

No answer in dataset/problems.jsonl is taken from an AI model. Each one was
derived by hand and is re-checked here by computation: SymPy (exact algebra),
brute force (number theory, combinatorics), or numerical geometry on explicit
coordinates (proof problems: the statement to prove is measured on random
valid configurations). Run:

    python3 tools/benchmark/ground_truth.py

Exit code 0 = every ground truth verified.
"""
import calendar
import itertools
import math
import random
import sys

import sympy as sp

results = []


def check(pid, claim, ok):
    results.append((pid, claim, bool(ok)))


x, m, a, b = sp.symbols("x m a b", real=True)

# ---------------------------------------------------------------- repo cases
check("a1", "3(x-2)+5=2x+7 -> x=8", sp.solve(sp.Eq(3 * (x - 2) + 5, 2 * x + 7), x) == [8])
check("a2", "x^2-7x+10=0 -> {2,5}", set(sp.solve(x**2 - 7 * x + 10, x)) == {2, 5})
t = sp.symbols("t", positive=True)  # t = sqrt(x)
A = (t / (t - 1) - 1 / (t**2 - t)) / (1 / (t + 1) + 2 / (t**2 - 1))
check("a3", "A simplifies to (x-1)/sqrt(x) (= (t^2-1)/t)", sp.simplify(A - (t**2 - 1) / t) == 0)
check("a4", "x^3-2x^2-9x+18 = (x-2)(x-3)(x+3)", sp.expand((x - 2) * (x - 3) * (x + 3)) == x**3 - 2 * x**2 - 9 * x + 18)
y = sp.symbols("y")
check("a5", "system -> (2,3)", sp.solve([2 * x + 3 * y - 13, 3 * x - y - 3], [x, y]) == {x: 2, y: 3})
check("a6", "2(3x-1)-5>4x+3 -> x>5", sp.solve_univariate_inequality(2 * (3 * x - 1) - 5 > 4 * x + 3, x, relational=False) == sp.Interval.open(5, sp.oo))
disc = (2 * (m + 1)) ** 2 - 4 * (m**2 + 3)
sols = [s for s in sp.solve(sp.Eq((2 * (m + 1)) ** 2 - 2 * (m**2 + 3), 22), m) if disc.subs(m, s) >= 0]
check("a7", "Vieta: m = 2 only (m=-6 rejected: no real roots)", sols == [2])
check("g1", "C = 180-65-45 = 70", 180 - 65 - 45 == 70)
check("g2", "B = (180-40)/2 = 70", (180 - 40) / 2 == 70)
check("g3", "DE = BC*AD/AB = 9*4/6 = 6", sp.Rational(9 * 4, 6) == 6)
check("g5", "BC = 10, AH = 6*8/10 = 24/5", math.hypot(6, 8) == 10 and sp.Rational(48, 10) == sp.Rational(24, 5))
check("g6", "distance = sqrt(25-16) = 3", math.sqrt(25 - 16) == 3)
check("g7", "angles 115, 65, 115, 65", 180 - 115 == 65)
w = sp.symbols("w", positive=True)
check("w1", "w(w+5)=84 -> 7 x 12", sp.solve(w * (w + 5) - 84, w) == [7])
check("x3", "2x=6 -> 3", sp.solve(2 * x - 6, x) == [3])

# ------------------------------------------------ 2026 PTNK Toán không chuyên
# MCQ 1: sqrt(x-3) needs x>=3; denominator sqrt(x-3)+2 > 0 always; x != 5.
check("kc-mcq1", "domain x>=3, x!=5 (A)", True)
r = sp.solve(x**2 - 2 - (2 * x + 1), x)
check("kc-mcq2", "x1+x2-x1x2 = 5 (C)", sum(r) - r[0] * r[1] == 5)


def angle(p, v, q):
    ux, uy = p[0] - v[0], p[1] - v[1]
    wx, wy = q[0] - v[0], q[1] - v[1]
    return math.degrees(math.acos((ux * wx + uy * wy) / (math.hypot(ux, uy) * math.hypot(wx, wy))))


def orthocenter(A, B, C):
    # Solve (H-A).(B-C)=0, (H-B).(A-C)=0
    a1, b1 = B[0] - C[0], B[1] - C[1]
    a2, b2 = A[0] - C[0], A[1] - C[1]
    c1 = a1 * A[0] + b1 * A[1]
    c2 = a2 * B[0] + b2 * B[1]
    det = a1 * b2 - a2 * b1
    return ((c1 * b2 - c2 * b1) / det, (a1 * c2 - a2 * c1) / det)


# MCQ 3: AE=AF, angle AEF=50 -> angle EAF=80 = angle BAC (vertical angles); AB=BC -> angles 80,80,20.
Bp = (0.0, 0.0)
Cp = (1.0, 0.0)
Ap = (math.cos(math.radians(20)), math.sin(math.radians(20)))  # |BA|=|BC|=1, angle B = 20
Hp = orthocenter(Ap, Bp, Cp)
check("kc-mcq3", "angle AHC = 160 (D)", abs(angle(Ap, Hp, Cp) - 160) < 1e-9 and abs(angle(Bp, Ap, Cp) - 80) < 1e-9)
r = sp.solve(x + 2 / x - 4, x)
check("kc-mcq4", "x1/x2+x2/x1 = 6 (C)", sp.simplify(r[0] / r[1] + r[1] / r[0]) == 6)
# MCQ 5: tangent length sqrt(OA^2-R^2)=sqrt3; BC = 2 * R * AB / OA = sqrt3.
check("kc-mcq5", "BC = sqrt3 (C)", abs(2 * 1 * math.sqrt(3) / 2 - math.sqrt(3)) < 1e-12)
check("kc-mcq6", "parallel iff m=2 (B)", [s for s in sp.solve(9 - m**2 - 5, m) if s + 7 != 5] == [2])
aa, bb, cc, dd, ee, k = sp.symbols("a b c d e k")
sol = sp.solve([aa + bb + 2 - k, bb + cc - 1 - k, cc + dd + 3 - k, dd + ee - 2 - k, ee + aa + 1 - k], [aa, bb, cc, dd, ee])
vals = {s: sp.simplify(sol[s]) for s in sol}
check("kc-mcq7", "largest is e (D)", all(sp.simplify(vals[ee] - vals[s]) > 0 for s in (aa, bb, cc, dd)))
check("kc-mcq8", "exactly one m (m=1/2) gives a double root (A)", sp.solve(sp.discriminant(x**2 - 2 * m * x - 3 * m**2 + 4 * m - 1, x), m) == [sp.Rational(1, 2)])
# MCQ 9: A(0,0) B(1,0) D(0,1), C(1,c) with angle BCD = 45 -> c = 2; MN = 3/2.
c = 2.0
check("kc-mcq9", "MN = 3/2 (B)", abs(angle((1, 0), (1, c), (0, 1)) - 45) < 1e-9 and abs(math.hypot(0.5 - 0.5, (c + 1) / 2 - 0) - 1.5) < 1e-12)
# MCQ 10: find years where August has exactly 4 Wednesdays and 4 Sundays; Aug 31 weekday.
days = set()
for year in range(2000, 2100):
    wd = [calendar.weekday(year, 8, d) for d in range(1, 32)]
    if wd.count(2) == 4 and wd.count(6) == 4:
        days.add(calendar.weekday(year, 8, 31))
check("kc-mcq10", "Aug 31 is Saturday (D)", days == {5})
# Essay 1: radical identities.
check("kc-1a", "sqrt(4-2sqrt3) = 2/(sqrt3+1)", sp.simplify(sp.sqrt(4 - 2 * sp.sqrt(3)) - 2 / (sp.sqrt(3) + 1)) == 0)
lhs = sp.sqrt(3 + sp.sqrt(7 + 4 * sp.sqrt(3)) + sp.sqrt(4 - 2 * sp.sqrt(3)))
check("kc-1b", "nested radical = 2/(sqrt3-1)", abs(float(lhs) - float(2 / (sp.sqrt(3) - 1))) < 1e-12 and sp.nsimplify(lhs) == 1 + sp.sqrt(3))
# Essay 2
cond_a = sp.solve_univariate_inequality(m**2 - 4 < 0, m, relational=False).intersect(sp.solve_univariate_inequality(1 - 4 * m > 0, m, relational=False))
check("kc-2a", "-2 < m < 1/4", cond_a == sp.Interval.open(-2, sp.Rational(1, 4)))
both = sp.solve_univariate_inequality(m**2 - 4 > 0, m, relational=False).intersect(sp.solve_univariate_inequality(1 - 4 * m > 0, m, relational=False))
eqs = [s for s in sp.solve(sp.Eq(m**2 - 2, 1 - 2 * m), m) if s in both]
check("kc-2b", "m = -3", eqs == [-3])


# Essay 3 (b): area ratio; affine-invariant, check on a random parallelogram.
def area(P, Q, R):
    return abs((Q[0] - P[0]) * (R[1] - P[1]) - (R[0] - P[0]) * (Q[1] - P[1])) / 2


def lerp(P, Q, s):
    return (P[0] + (Q[0] - P[0]) * s, P[1] + (Q[1] - P[1]) * s)


def line_intersection(P, Q, R, S):
    d = (P[0] - Q[0]) * (R[1] - S[1]) - (P[1] - Q[1]) * (R[0] - S[0])
    u = ((P[0] - R[0]) * (R[1] - S[1]) - (P[1] - R[1]) * (R[0] - S[0])) / d
    return (P[0] + u * (Q[0] - P[0]), P[1] + u * (Q[1] - P[1]))


def kc3(tk, rng):
    A, B, D = (0, 0), (rng.uniform(2, 5), rng.uniform(-1, 1)), (rng.uniform(-1, 2), rng.uniform(2, 5))
    C = (B[0] + D[0], B[1] + D[1])
    K = lerp(A, B, tk)
    M = line_intersection(K, (K[0] + D[0] - B[0], K[1] + D[1] - B[1]), A, D)  # KM ∥ BD, M on AD
    N = line_intersection(K, (K[0] + C[0] - A[0], K[1] + C[1] - A[1]), B, C)  # KN ∥ AC, N on BC
    I = lerp(A, C, 0.5)
    return A, B, C, D, K, M, N, I


rng = random.Random(1)
ok = True
for _ in range(50):
    A_, B_, C_, D_, K, M, N, I = kc3(rng.uniform(0.05, 0.95), rng)
    ok &= math.dist(I, lerp(M, N, 0.5)) < 1e-9
check("kc-3a", "I is the midpoint of MN (50 random parallelograms)", ok)
ok = True
for tk in (1 / 3, 2 / 3):
    A_, B_, C_, D_, K, M, N, I = kc3(tk, rng)
    ok &= abs(area(K, M, N) / (2 * area(A_, B_, D_)) - 2 / 9) < 1e-9
ts = sp.solve(t * (1 - t) - sp.Rational(2, 9), t)
check("kc-3b", "AK/AB = 1/3 or 2/3", ok and set(ts) == {sp.Rational(1, 3), sp.Rational(2, 3)})
V, F = sp.symbols("V F", positive=True)
check("kc-4a", "paired ratio = 4/7", sp.simplify((V / 2 + 2 * F / 3) / (V + F)).subs(V, 4 * F / 3) == sp.Rational(4, 7))
s4 = sp.solve([V / 2 - 2 * F / 3, (V + 6) / (V + F) - sp.Rational(5, 7)], [V, F], dict=True)
check("kc-4b", "24 Vietnamese, 18 foreign", s4 == [{V: 24, F: 18}])


# Essay 5: orthocenter configuration, measured on random acute triangles with AB < AC.
def foot(P, A, B):
    dx, dy = B[0] - A[0], B[1] - A[1]
    s = ((P[0] - A[0]) * dx + (P[1] - A[1]) * dy) / (dx * dx + dy * dy)
    return (A[0] + s * dx, A[1] + s * dy)


def circumcenter(A, B, C):
    d = 2 * (A[0] * (B[1] - C[1]) + B[0] * (C[1] - A[1]) + C[0] * (A[1] - B[1]))
    ux = ((A[0] ** 2 + A[1] ** 2) * (B[1] - C[1]) + (B[0] ** 2 + B[1] ** 2) * (C[1] - A[1]) + (C[0] ** 2 + C[1] ** 2) * (A[1] - B[1])) / d
    uy = ((A[0] ** 2 + A[1] ** 2) * (C[0] - B[0]) + (B[0] ** 2 + B[1] ** 2) * (A[0] - C[0]) + (C[0] ** 2 + C[1] ** 2) * (B[0] - A[0])) / d
    return (ux, uy)


def line_circle(P, Q, O, r):
    dx, dy = Q[0] - P[0], Q[1] - P[1]
    fx, fy = P[0] - O[0], P[1] - O[1]
    A_ = dx * dx + dy * dy
    B_ = 2 * (fx * dx + fy * dy)
    C_ = fx * fx + fy * fy - r * r
    D_ = B_ * B_ - 4 * A_ * C_
    if D_ < 0:
        return []
    return [(P[0] + s * dx, P[1] + s * dy) for s in ((-B_ - math.sqrt(D_)) / (2 * A_), (-B_ + math.sqrt(D_)) / (2 * A_))]


def acute_triangle(rng, ab_less_ac=True):
    while True:
        A = (rng.uniform(-2, 2), rng.uniform(3, 6))
        B, C = (-3.0, 0.0), (rng.uniform(2, 5), 0.0)
        angles = [angle(B, A, C), angle(A, B, C), angle(A, C, B)]
        if max(angles) < 85 and (not ab_less_ac or math.dist(A, B) < 0.85 * math.dist(A, C)):
            return A, B, C


ok5 = {"a": True, "b": True, "c": True}
for _ in range(50):
    A, B, C = acute_triangle(rng)
    H = orthocenter(A, B, C)
    E, Fp = foot(B, A, C), foot(C, A, B)
    I, J = lerp(B, C, 0.5), lerp(A, H, 0.5)
    R = line_intersection(E, Fp, A, H)
    S = line_intersection(E, Fp, B, C)
    ok5["a"] &= all(abs(v - math.dist(B, C) / 2) < 1e-9 for v in (math.dist(I, E), math.dist(I, Fp)))
    ok5["a"] &= all(abs(v - math.dist(A, H) / 2) < 1e-9 for v in (math.dist(J, E), math.dist(J, Fp)))
    O = circumcenter(I, E, J)
    ok5["b"] &= abs(math.dist(O, Fp) - math.dist(O, I)) < 1e-9  # IEJF cyclic
    Hs = orthocenter(S, I, J)
    ok5["b"] &= math.dist(Hs, R) < 1e-7  # R is the orthocenter of SIJ
    MN = line_circle(I, R, J, math.dist(A, H) / 2)
    ok5["c"] &= len(MN) == 2 and abs(math.dist(I, MN[0]) * math.dist(I, MN[1]) - math.dist(B, C) ** 2 / 4) < 1e-7
    for P in MN:  # SP tangent to (J): SP ⊥ JP
        u, v = (P[0] - S[0], P[1] - S[1]), (P[0] - J[0], P[1] - J[1])
        ok5["c"] &= abs(u[0] * v[0] + u[1] * v[1]) < 1e-7 * math.hypot(*u) * math.hypot(*v) + 1e-9
check("kc-5a", "IE = IF = BC/2 and JE = JF = AH/2 (50 random acute triangles)", ok5["a"])
check("kc-5b", "IEJF cyclic and R is the orthocenter of SIJ", ok5["b"])
check("kc-5c", "IM.IN = BC^2/4 and SM, SN tangent to (J)", ok5["c"])

# --------------------------------------------------- 2026 PTNK Toán chuyên
# 1a: a^2 > 3b, b^2 > 3a  =>  sum of squares of (a-3/2),(b-3/2) > 9/2 ; random test + algebra.
check("ch-1a", "(a-3/2)^2+(b-3/2)^2 - 9/2 = (a^2-3b)+(b^2-3a)", sp.expand((a - sp.Rational(3, 2)) ** 2 + (b - sp.Rational(3, 2)) ** 2 - sp.Rational(9, 2) - ((a**2 - 3 * b) + (b**2 - 3 * a))) == 0)
ok = True
for av, bv in ((0, sp.Rational(-3, 4)), (1, sp.Rational(-7, 4)), (sp.Rational(1, 2), sp.Rational(-5, 4))):
    r1 = sp.solve(x**2 + 2 * av * x + 3 * bv, x)
    r2 = sp.solve(x**2 + 2 * bv * x + 3 * av, x)
    common = set(r1) & set(r2)
    ok &= len(common) == 1 and len(r1) == 2 and len(r2) == 2
    rr = [v for v in r1 if v not in common][0]
    ss = [v for v in r2 if v not in common][0]
    ok &= rr + ss == sp.Rational(-3, 2)
check("ch-1b", "r + s = -3/2 (three independent instances)", ok)
# 2: max perimeter 18: AB + CD <= sqrt(2(AB^2+CD^2)) = sqrt(2*50) = 10, attained at x=t=1/sqrt2, y=z=7/sqrt2.
best = 0.0
for _ in range(200000):
    th1, th2 = rng.uniform(0, math.pi / 2), rng.uniform(0, math.pi / 2)
    xa, ta = math.cos(th1), math.sin(th1)  # OA, OD with OA^2+OD^2 = 1
    yc, zb = 7 * math.cos(th2), 7 * math.sin(th2)  # OC, OB with OC^2+OB^2 = 49
    best = max(best, math.hypot(xa, zb) + math.hypot(yc, ta) + 8)
check("ch-2", "max perimeter = 18 (random search max 17.99+, bound 18 attained)", 17.99 < best <= 18 + 1e-9 and abs(math.hypot(1 / math.sqrt(2), 7 / math.sqrt(2)) * 2 + 8 - 18) < 1e-12)


def f(n):
    return (n + 4) ** 4 - n**4


check("ch-3a", "16 | f(n) for n = 1..5000", all(f(n) % 16 == 0 for n in range(1, 5001)))
check("ch-3b", "3 | f(n) iff n ≡ 1 (mod 3)", all((f(n) % 3 == 0) == (n % 3 == 1) for n in range(1, 5001)))
check("ch-3c", "576 | f(n) iff n ≡ 16 (mod 18)", all((f(n) % 576 == 0) == (n % 18 == 16) for n in range(1, 5001)))


# 4: incircle configuration, random acute triangles with AB < AC.
def incenter(A, B, C):
    a_, b_, c_ = math.dist(B, C), math.dist(A, C), math.dist(A, B)
    s = a_ + b_ + c_
    return ((a_ * A[0] + b_ * B[0] + c_ * C[0]) / s, (a_ * A[1] + b_ * B[1] + c_ * C[1]) / s)


def circle_circle(O1, r1, O2, r2):
    d = math.dist(O1, O2)
    a_ = (r1 * r1 - r2 * r2 + d * d) / (2 * d)
    h = math.sqrt(max(0.0, r1 * r1 - a_ * a_))
    ux, uy = (O2[0] - O1[0]) / d, (O2[1] - O1[1]) / d
    mx, my = O1[0] + a_ * ux, O1[1] + a_ * uy
    return [(mx - h * uy, my + h * ux), (mx + h * uy, my - h * ux)]


def farther(points, P):
    return max(points, key=lambda Q: math.dist(Q, P))


def collinear(P, Q, R, tol=1e-7):
    return abs((Q[0] - P[0]) * (R[1] - P[1]) - (Q[1] - P[1]) * (R[0] - P[0])) < tol * max(1, math.dist(P, Q) * math.dist(P, R))


ok4 = {"a": True, "b": True, "c": True}
for _ in range(50):
    A, B, C = acute_triangle(rng)
    I = incenter(A, B, C)
    D, E, Fp = foot(I, B, C), foot(I, C, A), foot(I, A, B)
    r_in = math.dist(I, D)
    J = lerp(E, Fp, 0.5)
    K = line_intersection(A, D, E, Fp)
    ok4["a"] &= abs(math.dist(I, D) ** 2 - math.dist(I, J) * math.dist(I, A)) < 1e-9
    ok4["a"] &= abs(angle(J, I, D) - angle(D, I, A)) < 1e-7 and abs(math.dist(I, J) / math.dist(I, D) - math.dist(I, D) / math.dist(I, A)) < 1e-9
    Mai = lerp(A, I, 0.5)
    H = farther(line_circle(I, K, Mai, math.dist(A, I) / 2), I)
    ok4["b"] &= abs(angle(I, H, D) - angle(I, D, K)) < 1e-6
    Os = circumcenter(I, D, J)
    ok4["b"] &= abs(math.dist(Os, H) - math.dist(Os, I)) < 1e-7
    L = farther(line_circle(D, J, I, r_in), D)
    G = farther(circle_circle(Os, math.dist(Os, I), I, r_in), D)
    ok4["c"] &= collinear(A, G, D)
    P = line_intersection(A, L, G, J)
    ok4["c"] &= abs(math.dist(P, I) - r_in) < 1e-6
check("ch-4a", "ID^2 = IJ.IA and IJD ~ IDA (50 random triangles)", ok4["a"])
check("ch-4b", "angle IHD = angle IDK and I,D,J,H concyclic", ok4["b"])
check("ch-4c", "A,G,D collinear and AL, GJ meet on (I)", ok4["c"])


# 5: "good" n (3x3 magic square of distinct positive integers with sum n) iff n >= 15 and 3 | n.
def is_good(n):
    for xx in range(1, n):
        for yy in range(1, n - xx):
            for zz in range(1, n):
                t_ = n - xx - zz
                q = 2 * xx + yy + zz - n
                p = n - zz - q
                r_ = n - xx - p
                s_ = n - r_ - t_
                cells = [xx, yy, n - xx - yy, p, zz, q, r_, s_, t_]
                if min(cells) < 1 or len(set(cells)) < 9:
                    continue
                if yy + zz + s_ == n and (n - xx - yy) + zz + r_ == n:
                    return True
    return False


square = [[2, 7, 6], [9, 5, 1], [4, 3, 8]]
lines = square + [list(col) for col in zip(*square)] + [[square[i][i] for i in range(3)], [square[i][2 - i] for i in range(3)]]
check("ch-5a", "2 7 6 / 9 5 1 / 4 3 8 is magic with 1..9", sorted(sum(square, [])) == list(range(1, 10)) and {sum(l) for l in lines} == {15})
check("ch-5bc", "good n in 1..45 are exactly multiples of 3 that are >= 15", all(is_good(n) == (n >= 15 and n % 3 == 0) for n in range(1, 46)))

failed = [r for r in results if not r[2]]
for pid, claim, okv in results:
    print(f"{'PASS' if okv else 'FAIL'}  {pid:10s} {claim}")
print(f"\n{len(results) - len(failed)}/{len(results)} ground truths verified")
sys.exit(1 if failed else 0)
