from __future__ import annotations

import pytest

from app.classification.heuristic import classify


@pytest.mark.parametrize(("text", "topic"), [
    ("Cho tam giác $ABC$ nội tiếp đường tròn $(O)$. Chứng minh $OM \\perp BC$.", "geometry"),
    ("Tìm tất cả số nguyên $n$ sao cho $n^2+1$ chia hết cho $5$.", "number_theory"),
    ("Có bao nhiêu cách xếp $5$ học sinh thành một hàng?", "combinatorics"),
    ("Giải hệ phương trình $\\begin{cases} x+y=5 \\\\ xy=6 \\end{cases}$", "algebra"),
    ("Tìm giá trị nhỏ nhất của biểu thức $P = x^2 + y^2$.", "algebra"),
])
def test_primary_topic(text: str, topic: str) -> None:
    topics, _ = classify(text)
    assert topics and topics[0] == topic


def test_mixed_topic() -> None:
    topics, _ = classify("Tìm nghiệm nguyên của phương trình $x^2 + y^2 = 2025$, biết chia hết cho số nguyên tố "
                         "và giải hệ phương trình.")
    assert {"number_theory", "algebra"} <= set(topics)


def test_unknown_returns_empty() -> None:
    assert classify("Xin chào")[0] == []
