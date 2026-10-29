"""Versioned curriculum policy and the deterministic checker that enforces it.

Compliance is judged from what the solution actually says (its text and LaTeX) and from the techniques it
declares. Declaring only allowed techniques is not enough: a prohibited method found in the text fails the
solution even if it was not declared. Style rules (from teacher reviews) are reported as warnings.
"""

from __future__ import annotations

import json
import re
import unicodedata
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path
from typing import Literal

POLICY_FILE = Path(__file__).with_name("policy_v1.json")

Severity = Literal["prohibited", "discouraged", "style"]


@dataclass(frozen=True)
class Rule:
    id: str
    name_vi: str
    patterns: tuple[re.Pattern[str], ...]
    topic: str | None = None
    reason_vi: str | None = None


@dataclass(frozen=True)
class Policy:
    version: str
    allowed: dict[str, str]  # id → Vietnamese name
    allowed_topics: dict[str, str]
    prohibited: tuple[Rule, ...]
    discouraged: tuple[Rule, ...]
    style: tuple[Rule, ...]

    def allowed_list_vi(self, topics: list[str] | None = None) -> str:
        """Bullet list of allowed techniques (optionally the given topics first) for prompts."""
        ids = sorted(self.allowed, key=lambda i: (self.allowed_topics[i] not in (topics or []), i))
        return "\n".join(f"- {i}: {self.allowed[i]}" for i in ids)

    def prohibited_list_vi(self) -> str:
        return "\n".join(f"- {r.name_vi}" for r in self.prohibited)


def _rules(items: list[dict[str, object]], name_key: str) -> tuple[Rule, ...]:
    return tuple(Rule(id=str(i["id"]), name_vi=str(i.get(name_key) or i.get("name_vi") or i["id"]),
                      patterns=tuple(re.compile(str(p), re.IGNORECASE) for p in i["patterns"]),  # type: ignore[attr-defined]
                      topic=str(i["topic"]) if i.get("topic") else None,
                      reason_vi=str(i["reason_vi"]) if i.get("reason_vi") else None) for i in items)


@lru_cache
def load_policy(path: Path = POLICY_FILE) -> Policy:
    data = json.loads(path.read_text(encoding="utf-8"))
    return Policy(
        version=data["version"],
        allowed={a["id"]: a["name_vi"] for a in data["allowed"]},
        allowed_topics={a["id"]: a["topic"] for a in data["allowed"]},
        prohibited=_rules(data["prohibited"], "name_vi"),
        discouraged=_rules(data["discouraged"], "name_vi"),
        style=_rules(data["style"], "message_vi"),
    )


@dataclass(frozen=True)
class Finding:
    rule_id: str
    severity: Severity
    message: str
    excerpt: str | None = None


@dataclass
class CurriculumReport:
    policy_version: str
    findings: list[Finding] = field(default_factory=list)

    @property
    def compliant(self) -> bool:
        return not any(f.severity == "prohibited" for f in self.findings)

    @property
    def status(self) -> Literal["COMPLIANT", "COMPLIANT_WITH_WARNINGS", "NON_COMPLIANT"]:
        if not self.compliant:
            return "NON_COMPLIANT"
        return "COMPLIANT_WITH_WARNINGS" if self.findings else "COMPLIANT"


def _excerpt(text: str, match: re.Match[str]) -> str:
    start, end = max(0, match.start() - 30), min(len(text), match.end() + 30)
    return ("…" if start else "") + text[start:end].replace("\n", " ") + ("…" if end < len(text) else "")


def check_curriculum(texts: list[str], declared_techniques: list[str], topics: list[str],
                     policy: Policy | None = None) -> CurriculumReport:
    policy = policy or load_policy()
    report = CurriculumReport(policy_version=policy.version)
    body = unicodedata.normalize("NFC", "\n".join(texts))

    for technique in dict.fromkeys(declared_techniques):
        if technique not in policy.allowed:
            prohibited = next((r for r in policy.prohibited if r.id == technique), None)
            if prohibited is not None:
                report.findings.append(Finding(technique, "prohibited",
                                               f"Lời giải dùng phương pháp ngoài chương trình: {prohibited.name_vi}."))
            else:
                report.findings.append(Finding(technique, "discouraged",
                                               f"Kỹ thuật “{technique}” không có trong danh mục được phép."))

    def scan(rules: tuple[Rule, ...], severity: Severity) -> None:
        for rule in rules:
            if rule.topic and rule.topic not in topics:
                continue
            if any(f.rule_id == rule.id for f in report.findings):
                continue
            for pattern in rule.patterns:
                match = pattern.search(body)
                if match:
                    if severity == "prohibited":
                        message = f"Lời giải dùng phương pháp ngoài chương trình: {rule.name_vi}."
                    elif severity == "discouraged":
                        message = f"{rule.name_vi}. {rule.reason_vi or ''}".strip()
                    else:
                        message = rule.name_vi
                    report.findings.append(Finding(rule.id, severity, message, _excerpt(body, match)))
                    break

    scan(policy.prohibited, "prohibited")
    scan(policy.discouraged, "discouraged")
    scan(policy.style, "style")
    return report
