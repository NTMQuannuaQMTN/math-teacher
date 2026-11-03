"""Number theory solver guidance: divisibility, primes, gcd/lcm, congruences, integer equations, squares."""

GUIDANCE = """Number theory:
- Divisibility (a ⋮ b, a chia hết cho b) is only written between integers; never split a divisibility
  relation into fractions.
- Prefer a factorisation or an identity (e.g. a product of consecutive integers) over a table of remainders;
  use residues mod m only when no shorter standard argument exists, and then cover every residue.
- Integer equations: factor, bound (chặn) the variables, or squeeze between consecutive squares; finish by
  listing every solution and checking each satisfies the original equation inside the argument (not as a
  separate "kiểm tra lại" step).
- Never conclude from trying small numbers alone; any case split must be complete.
- As in the official keys: write the equation as a product equal to a known number ((m - 2)(n - 2) = 14,
  (n - m)(n + m + 1) = 3.2^k), use parity ("n - m lẻ") to cut the cases, then list them as TH1, TH2, … each a
  system, marking each result (nhận) or (loại). A prime p dividing a product divides a factor:
  "a^2 - 4b^2 ⋮ 11 ⇒ a - 2b ⋮ 11 hoặc a + 2b ⋮ 11". From x ⋮ y with x ≠ 0 conclude |x| ≥ |y|.
- Symmetric equations: say so first ("Nếu $(a; b)$ thỏa mãn thì $(-a; b)$, $(a; -b)$, $(-a; -b)$ cũng thỏa mãn"),
  solve for non-negative values, then write out EVERY solution in the conclusion, e.g. "Vậy có 8 cặp số nguyên
  $(x; y)$ thỏa mãn: $(36; 34)$, $(-36; 34)$, …" — never ± or "và các hoán vị" in the final answer.
- Proof by contradiction: "Giả sử …", derive the contradiction, write "(vô lí)", then the conclusion.
"""
