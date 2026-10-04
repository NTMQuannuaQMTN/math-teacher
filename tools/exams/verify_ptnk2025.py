"""Independent checks of the PTNK 2025 answers (internal evaluation; no reference text stored).

  python3 tools/exams/verify_ptnk2025.py
"""
from fractions import Fraction as Fr
from itertools import combinations, permutations
from math import gcd, sqrt

out = []

# Bài 1 b: x1^4 + x2^4 > 9/2 for all m (numerical scan, and the infimum).
def roots(m):
    d = sqrt((m + 1) ** 2 - 2 * m)
    return m + 1 - d, m + 1 + d
vals = [sum(r ** 4 for r in roots(m / 1000)) for m in range(-5000, 5001)]
out.append(f"1b: min over m in [-5,5] (step 0.001) = {min(vals):.6f} > 4.5: {min(vals) > 4.5}")
# Bài 1 c: (x1+sqrt(x1^2+1))(x2+sqrt(x2^2+1)) = 1 iff m = -1 (scan).
def g(m):
    x1, x2 = roots(m)
    return (x1 + sqrt(x1 * x1 + 1)) * (x2 + sqrt(x2 * x2 + 1))
hits = [m / 1000 for m in range(-5000, 5001) if abs(g(m / 1000) - 1) < 1e-9]
out.append(f"1c: m in [-5,5] with product = 1: {hits}")

# Bài 2: a+b=0 and {b+c, c+d, d+a} = {1,2,3}, distinct a,b,c,d; minimise a²+b²+c²+d² (exact, per assignment of sums).
best = None
for s_bc, s_cd, s_da in permutations([1, 2, 3]):
    # b = -a, c = s_bc + a, d = s_cd - c; consistency: d + a = s_da
    # d = s_cd - s_bc - a → d + a = s_cd - s_bc must equal s_da
    if s_cd - s_bc != s_da:
        continue
    # T(a) = a² + a² + (s_bc+a)² + (s_cd-s_bc-a)² is a quadratic: minimise exactly
    A = 4
    B = 2 * s_bc - 2 * (s_cd - s_bc)
    a = Fr(-B, 2 * A)
    quad = [a, -a, s_bc + a, s_cd - s_bc - a]
    if len(set(quad)) == 4:
        T = sum(x * x for x in quad)
        if best is None or T < best[0]:
            best = (T, [])
        if T == best[0]:
            best[1].append(tuple(str(x) for x in quad))
out.append(f"2b: min T = {best[0]} at (a,b,c,d) = {best[1]}")
ex = (1, -1, 3, 0)
out.append(f"2a: STAR example {ex} valid: {ex[0]+ex[1]==0 and sorted([ex[1]+ex[2], ex[2]+ex[3], ex[3]+ex[0]])==[1,2,3] and len(set(ex))==4}")

# Bài 3: m² + m + n² divisible by mn.
sol = [(m, n) for m in range(1, 3001) for n in range(1, 201) if (m * m + m + n * n) % (m * n) == 0]
out.append(f"3a: solutions with n = 3 (m ≤ 3000): {[s for s in sol if s[1] == 3]}")
out.append(f"3b: solutions with n | m: {[s for s in sol if s[0] % s[1] == 0]}")
out.append(f"3c: every solution has m = gcd(m,n)²: {all(m == gcd(m, n) ** 2 for m, n in sol)} ({len(sol)} solutions, m ≤ 3000, n ≤ 200)")

# Bài 5: shortest guaranteed win for Bình, as a search over the set of cells An may be in.
R, C = 2, 9
cells = [(r, c) for r in range(R) for c in range(C)]
idx = {x: i for i, x in enumerate(cells)}
nbr = [sum(1 << idx[(r + dr, c + dc)] for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)) if (r + dr, c + dc) in idx) for r, c in cells]
FULL = (1 << len(cells)) - 1
def move(s):
    t = 0
    for i in range(len(cells)):
        if s >> i & 1:
            t |= nbr[i]
    return t
def shortest(k, an_moves_first, limit):
    # States after Bình's turn; BFS on the possible-set. Bình always removes k cells of the moved set.
    start = FULL
    frontier = {start}
    seen = {start}
    for turn in range(1, limit + 1):
        nxt = set()
        for s in frontier:
            t = move(s) if (an_moves_first or turn > 1) else s
            bits = [i for i in range(len(cells)) if t >> i & 1]
            if len(bits) <= k:
                return turn
            for pick in combinations(bits, k):
                u = t
                for i in pick:
                    u &= ~(1 << i)
                if u not in seen:
                    seen.add(u)
                    nxt.add(u)
        # keep only minimal sets (a subset is never worse for Bình)
        frontier = nxt
        if not frontier:
            return None
    return None
for k, bound in ((4, 8), (2, 16)):
    for name, first in (("official order (An moves, then Bình asks)", True), ("STAR order (Bình asks, then An moves)", False)):
        n = shortest(k, first, bound)
        out.append(f"5 k={k}: {name}: Bình's shortest guaranteed win = {n if n else f'> {bound}'} turns (bound {bound})")

print("\n".join(out))


# Bài 4 (numerical, many random configurations satisfying the hypotheses).
import cmath, random

def bai4(trials=2000, seed=1):
    rnd = random.Random(seed)
    P = lambda t: cmath.exp(1j * t)
    def inter(p1, p2, q1, q2):
        d1, d2 = p2 - p1, q2 - q1
        den = (d1.conjugate() * d2).imag
        t = ((q1 - p1).conjugate() * d2).imag / den
        return p1 + t * d1
    def circum(a, b, c):
        ma, mb = (a + b) / 2, (b + c) / 2
        return inter(ma, ma + (b - a) * 1j, mb, mb + (c - b) * 1j)
    def angle(a, v, b):
        return abs(cmath.phase((a - v) / (b - v))) * 180 / cmath.pi
    worst = {"4a": 0.0, "4b_sim": 0.0, "4b_H_on_O": 0.0, "4c_RKD": 0.0, "4c_mid": 0.0}
    used = 0
    while used < trials:
        a, b, c = sorted(rnd.uniform(0, 2 * cmath.pi) for _ in range(3))
        A, B, C = P(a), P(b), P(c)
        angA, angB, angC = angle(B, A, C), angle(A, B, C), angle(A, C, B)
        if not (90 > angA > angB > angC):  # acute, Â > B̂ > Ĉ
            continue
        # D on the minor arc AC (the arc not containing B), with CD > AB
        ta, tc = cmath.phase(A), cmath.phase(C)
        for _ in range(20):
            t = rnd.uniform(0, 1)
            # walk from A to C the short way that avoids B
            dphi = cmath.phase(C / A)
            D = A * P(t * dphi)
            if abs(angle(A, D, C) + angle(A, B, C) - 180) < 1e-6 and abs(C - D) > abs(A - B):
                break
        else:
            continue
        used += 1
        O = 0j
        M1 = (D + B) / 2; E = inter(M1, M1 + (B - D) * 1j, A, B)
        M2 = (D + C) / 2; F = inter(M2, M2 + (C - D) * 1j, A, C)
        I = circum(A, D, E)
        r = abs(A - I)
        worst["4a"] = max(worst["4a"], abs(abs(F - I) - r), abs(abs(O - I) - r))
        # DEB ~ DFC: ratios DE/DB = DF/DC and equal apex angles
        worst["4b_sim"] = max(worst["4b_sim"], abs(abs(D - E) / abs(D - B) - abs(D - F) / abs(D - C)))
        HA = inter(A, A + (C - B) * 1j, D, D + (F - E) * 1j)
        worst["4b_H_on_O"] = max(worst["4b_H_on_O"], abs(abs(HA) - 1))
        S = inter(O, O + (O - I) * 1j, D, D + (D - O) * 1j)
        R = (D + O) / 2
        Q = circum(S, D, O)
        # second intersection K of line IS with circle (Q): K = S + t (I - S), |K - Q| = |S - Q|, t ≠ 0
        d = I - S
        t = -2 * ((S - Q).conjugate() * d).real / abs(d) ** 2
        K = S + t * d
        worst["4c_RKD"] = max(worst["4c_RKD"], abs(angle(R, K, D) - 90))
        T = (I + R) / 2
        worst["4c_mid"] = max(worst["4c_mid"], abs(((K - D).conjugate() * (T - D)).imag) / (abs(K - D) * abs(T - D)))
    return used, worst

n4, w4 = bai4()
print(f"4: {n4} random configurations; worst deviations: " + ", ".join(f"{k} {v:.2e}" for k, v in w4.items()))
