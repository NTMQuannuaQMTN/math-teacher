"""Preliminary topic classification by weighted Vietnamese keywords (free, deterministic).

This is a first guess shown to the student for confirmation; Phase 3 adds model-based classification.
Multiple topics above the threshold indicate a mixed-topic problem.
"""

from __future__ import annotations

import re
import unicodedata

TOPICS = ("algebra", "geometry", "number_theory", "combinatorics")

_KEYWORDS: dict[str, list[tuple[str, float]]] = {
    "geometry": [
        (r"tam giác", 3), (r"đường tròn", 3), (r"tứ giác", 3), (r"hình (vuông|chữ nhật|thang|bình hành|thoi)", 3),
        (r"tiếp tuyến", 3), (r"nội tiếp", 2), (r"ngoại tiếp", 2), (r"trung điểm", 2), (r"đường cao", 2),
        (r"phân giác", 2), (r"vuông góc", 2), (r"song song", 1.5), (r"thẳng hàng", 2), (r"đồng quy", 2),
        (r"bán kính", 2), (r"dây cung", 2), (r"\\angle|\\triangle|\\perp|\\parallel|\\widehat", 2),
        (r"hình chiếu", 2), (r"trực tâm", 3), (r"trọng tâm", 2), (r"đồng dạng", 2), (r"cung\b", 1),
    ],
    "number_theory": [
        (r"chia hết", 3), (r"số nguyên tố", 3), (r"ước chung|bội chung|ƯCLN|BCNN|\\gcd", 3),
        (r"số chính phương", 3), (r"chia .{0,20}dư|số dư", 3), (r"\\vdots|\\equiv|\\pmod|\\mid", 2),
        (r"nghiệm nguyên", 3), (r"số nguyên dương", 1.5), (r"số tự nhiên", 1), (r"chữ số", 1.5),
        (r"đồng dư", 3), (r"phân tích ra thừa số", 2), (r"lập phương", 1),
    ],
    "combinatorics": [
        (r"có bao nhiêu cách", 3), (r"bao nhiêu (số|cách|tập|đường)", 2), (r"tô màu", 3), (r"bảng ô vuông", 3),
        (r"Dirichlet|chuồng", 3), (r"bất biến", 3), (r"trò chơi|người chơi", 2), (r"học sinh", 1),
        (r"đội|giải đấu|trận", 1.5), (r"sắp xếp|xếp hàng", 2), (r"tập hợp con", 2), (r"\\binom", 2),
        (r"luôn tồn tại|chứng minh rằng tồn tại", 1.5), (r"ô vuông", 1.5), (r"viên bi|đồng xu", 2),
    ],
    "algebra": [
        (r"phương trình", 2), (r"hệ phương trình", 3), (r"bất đẳng thức", 3), (r"giá trị (lớn|nhỏ) nhất", 3),
        (r"rút gọn", 3), (r"biểu thức", 1.5), (r"căn|\\sqrt", 1.5), (r"đa thức", 2), (r"tham số|\bm\b", 1.5),
        (r"parabol|đồ thị hàm số|hàm số", 2.5), (r"Vi-?ét|Viète", 3), (r"\\frac", 0.5), (r"\\begin\{cases\}", 2),
        (r"nghiệm", 1), (r"\^\{?2\}?", 0.5), (r"chứng minh rằng .{0,40}\\(ge|le)", 2),
    ],
}

_THRESHOLD = 2.5
_MIXED_RATIO = 0.6


def classify(text: str) -> tuple[list[str], dict[str, float]]:
    """Return (topics ordered by score, scores). Empty list when nothing is recognised."""
    normalized = unicodedata.normalize("NFC", text)
    scores: dict[str, float] = {}
    for topic, patterns in _KEYWORDS.items():
        score = 0.0
        for pattern, weight in patterns:
            hits = len(re.findall(pattern, normalized, flags=re.IGNORECASE))
            score += weight * min(hits, 3)
        scores[topic] = score
    ranked = sorted((t for t in TOPICS if scores[t] >= _THRESHOLD), key=lambda t: -scores[t])
    if not ranked:
        return [], scores
    top = scores[ranked[0]]
    return [t for t in ranked if scores[t] >= top * _MIXED_RATIO], scores
