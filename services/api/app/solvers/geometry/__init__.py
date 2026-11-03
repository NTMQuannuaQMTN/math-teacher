"""Geometry solver guidance (Phase 3: text solutions only; the formal geometry engine arrives in Phase 4)."""

GUIDANCE = """Geometry:
- Use congruent/similar triangles, angle chasing, inscribed angles, tangent properties, cyclic quadrilaterals,
  Ta-lét, Py-ta-go and trigonometric ratios of acute angles.
- No transformations as proof tools (tịnh tiến, đối xứng, vị tự, quay), no vectors, no coordinates, no advanced
  theorems. Grade 9 only recognises the rotations that map a regular polygon onto itself (centre, angle 360°/n);
  answer such a question directly.
- Measurement questions (hình trụ, hình nón, hình cầu, độ dài cung, diện tích hình quạt): write the formula, then
  the value with π ≈ 3,14 only when the question asks for an approximate value, e.g. "S = 2πRh ≈ 2.3,14.50.150 ≈
  47 100 (cm²)", with the unit in brackets.
- A fact that is not a textbook theorem is stated as "Ta chứng minh bổ đề sau: …" and proved, then used; area
  ratios (S_{AKF}/S_{ADB} = …) and a parallel line through a point are standard tools.
- Products and squares of lengths ($AB.AC = AE.AS$, $OB^2 = OH.OA$) come from a named pair of similar triangles:
  "$\\triangle OHB \\backsim \\triangle OBA$ (g.g) $\\Rightarrow \\frac{OH}{OB} = \\frac{OB}{OA}$
  $\\Rightarrow OB^2 = OH.OA$".
  The official keys never cite Menelaus, Ceva, Ptolemy or "phương tích" by name; prefer similar triangles or area
  ratios, and if such a fact is needed, prove it as a bổ đề. A hard part (tiếp tuyến, đường tròn ngoại tiếp, điểm
  cố định, đồng quy) is solved by finding the right auxiliary cyclic quadrilateral or similar pair — never declared
  "beyond Grade 9".
- Every new point gets a letter name, as on a student's figure: "Gọi $M$ là trung điểm của $BC$", "$A'$ là hình chiếu
  của $A$ trên $BC$", $A_1$, $K$ …; never descriptive names such as midAB or H_A.
- Name intersections in words: "Gọi P là giao điểm của AL và GJ" — never set notation such as AL ∩ GJ.
- Name circles by their centre, e.g. (O); never Γ.
- Collinearity as in the official keys: two adjacent angles at the middle point sum to 180° ("$\\widehat{MLE} +
  \\widehat{ALE} = 180^\\circ$. Vậy $A, L, M$ thẳng hàng").
- Prove only what is asked (vuông góc, thẳng hàng, nội tiếp, bằng nhau …). Do not prove configuration facts
  such as the order of points or that a triangle is acute; write "góc I chung" for a shared angle.
- Each angle equality states its reason (cùng chắn cung …, góc tạo bởi tiếp tuyến và dây cung …, cùng phụ …,
  cùng bù …); "(cmt)" refers to a fact proved earlier. Similar triangles end with the case: "(g.g)", "(c.g.c)".
- Cyclic quadrilateral with two right angles on one side: "$\\triangle AHB$ vuông tại $H$, $\\triangle AEB$ vuông
  tại $E$ nên $A, B, H, E$ cùng thuộc đường tròn đường kính $AB$. Vậy tứ giác $ABHE$ nội tiếp."
"""
