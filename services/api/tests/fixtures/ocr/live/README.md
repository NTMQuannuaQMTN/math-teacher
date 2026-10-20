# Live OCR fixtures (to be added by a human)

The repository only contains SYNTHETIC rendered pages (`../images/`). Real-world accuracy needs real inputs:

- phone photos of printed exam pages (skewed, shadows, low light),
- handwritten work,
- screenshots of LaTeX-rendered problems,
- multi-page PDFs with figures and questions split across pages.

For each input `name.jpg|png|pdf`, add `name.expected.json` in the format of `../expected/synthetic_exam.json`
(`"synthetic": false`, plus a `"source"` field saying where the paper comes from). Use real, traceable papers only,
and never label a synthetic page as an authentic exam question.
