"""Generate SYNTHETIC OCR fixtures (not authentic exam questions).

Outputs into tests/fixtures/ocr/:
  images/synthetic_page1.png, images/synthetic_page2.png  — printed Vietnamese text + mathtext
  images/synthetic_exam.pdf                               — the same two pages as a PDF
  images/encrypted.pdf                                    — password-protected PDF (must be rejected)
  expected/synthetic_exam.json                            — ground-truth transcription for live OCR tests

Run: uv run python scripts/make_ocr_fixtures.py
"""

from __future__ import annotations

import io
import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages
from matplotlib.patches import Circle, Polygon
from pypdf import PdfReader, PdfWriter

OUT = Path(__file__).resolve().parent.parent / "tests" / "fixtures" / "ocr"

PAGE1 = [
    ("ĐỀ LUYỆN TẬP SỐ 1 (đề tổng hợp dùng để kiểm thử, không phải đề thi thật)", None),
    ("Câu 1.", "Giải phương trình $x^2 - 5x + 6 = 0$."),
    ("Câu 2.", "Cho $a, b > 0$ thỏa mãn $a + b = 2$. Chứng minh rằng $\\frac{1}{a} + \\frac{1}{b} \\geq 2$."),
    ("Câu 3.", "Tìm tất cả số nguyên $n$ sao cho $n^2 + 1$ chia hết cho $5$."),
    ("Câu 4.", "Cho hệ phương trình $x + y = 5$ và $xy = 6$."),
    (None, "a) Tính $x^2 + y^2$."),
    (None, "b) Tính $\\sqrt{x} + \\sqrt{y}$ khi $x \\leq y$."),
]
PAGE2 = [
    ("Câu 5.", "Cho tam giác $ABC$ nội tiếp đường tròn $(O)$. Gọi $M$ là trung điểm của $BC$."),
    (None, "Chứng minh rằng $OM \\perp BC$."),
]

EXPECTED = {
    "synthetic": True,
    "questions": [
        {"number": "Câu 1", "latex": "Giải phương trình $x^2 - 5x + 6 = 0$.", "subquestions": []},
        {"number": "Câu 2", "latex": "Cho $a, b > 0$ thỏa mãn $a + b = 2$. Chứng minh rằng "
                                     "$\\frac{1}{a} + \\frac{1}{b} \\ge 2$.", "subquestions": []},
        {"number": "Câu 3", "latex": "Tìm tất cả số nguyên $n$ sao cho $n^2 + 1$ chia hết cho $5$.",
         "subquestions": []},
        {"number": "Câu 4", "latex": "Cho hệ phương trình $x + y = 5$ và $xy = 6$.",
         "subquestions": [{"label": "a)", "latex": "Tính $x^2 + y^2$."},
                          {"label": "b)", "latex": "Tính $\\sqrt{x} + \\sqrt{y}$ khi $x \\le y$."}]},
        {"number": "Câu 5", "latex": "Cho tam giác $ABC$ nội tiếp đường tròn $(O)$. Gọi $M$ là trung điểm của "
                                     "$BC$.\nChứng minh rằng $OM \\perp BC$.", "subquestions": []},
    ],
}


def _page(lines: list[tuple[str | None, str | None]], figure: bool) -> plt.Figure:
    fig = plt.figure(figsize=(8.27, 11.69), dpi=110)  # A4
    y = 0.94
    for label, body in lines:
        if body is None:
            fig.text(0.5, y, label or "", ha="center", fontsize=12, fontweight="bold")
        elif label:
            fig.text(0.08, y, label, fontsize=12, fontweight="bold")
            fig.text(0.17, y, body, fontsize=12)
        else:
            fig.text(0.17, y, body, fontsize=12)
        y -= 0.05
    if figure:
        ax = fig.add_axes((0.3, 0.35, 0.4, 0.3))
        ax.set_aspect("equal")
        ax.axis("off")
        ax.add_patch(Circle((0, 0), 1, fill=False, lw=1.2))
        pts = {"A": (-0.2, 0.98), "B": (-0.87, -0.5), "C": (0.87, -0.5)}
        ax.add_patch(Polygon(list(pts.values()), fill=False, lw=1.2))
        ax.plot([0, 0], [0, -0.5], lw=1)
        for name, (px, py) in {**pts, "O": (0, 0), "M": (0, -0.5)}.items():
            ax.plot(px, py, "k.", ms=4)
            ax.annotate(name, (px, py), textcoords="offset points", xytext=(4, 4), fontsize=11)
        ax.set_xlim(-1.2, 1.2)
        ax.set_ylim(-1.2, 1.2)
    return fig


def main() -> None:
    (OUT / "images").mkdir(parents=True, exist_ok=True)
    (OUT / "expected").mkdir(parents=True, exist_ok=True)
    pdf_buffer = io.BytesIO()
    with PdfPages(pdf_buffer) as pdf:
        for index, (lines, figure) in enumerate([(PAGE1, False), (PAGE2, True)], start=1):
            fig = _page(lines, figure)
            fig.savefig(OUT / "images" / f"synthetic_page{index}.png", dpi=110)
            pdf.savefig(fig)
            plt.close(fig)
    (OUT / "images" / "synthetic_exam.pdf").write_bytes(pdf_buffer.getvalue())

    writer = PdfWriter()
    for page in PdfReader(io.BytesIO(pdf_buffer.getvalue())).pages[:1]:
        writer.add_page(page)
    writer.encrypt(user_password="secret", owner_password="owner")
    with (OUT / "images" / "encrypted.pdf").open("wb") as fh:
        writer.write(fh)

    (OUT / "expected" / "synthetic_exam.json").write_text(json.dumps(EXPECTED, ensure_ascii=False, indent=2) + "\n",
                                                          encoding="utf-8")
    print("fixtures written to", OUT)


if __name__ == "__main__":
    main()
