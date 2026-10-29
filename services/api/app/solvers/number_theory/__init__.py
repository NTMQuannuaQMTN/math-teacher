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
"""
