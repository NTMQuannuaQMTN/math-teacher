from __future__ import annotations

from typing import Any

from ...models import Asset, Document, DocumentPage, Job, Question, Solution
from ...solvers.service import SolutionView
from .schemas import (
    AssetOut,
    DocumentOut,
    DocumentSummaryOut,
    JobOut,
    PageOut,
    PageResultOut,
    QuestionOut,
    SolutionOut,
)

API = "/api/v1"


def job_out(job: Job) -> JobOut:
    progress: dict[str, Any] = {k: v for k, v in (job.progress or {}).items() if isinstance(v, int | str)}
    return JobOut(id=job.id, kind=job.kind, status=job.status,
                  progress=progress, error_code=job.error_code, error_message=job.error_message,
                  attempts=job.attempts, created_at=job.created_at, updated_at=job.updated_at)


def asset_out(asset: Asset) -> AssetOut:
    return AssetOut(id=asset.id, kind=asset.kind, url=f"{API}/assets/{asset.id}", page_number=asset.page_number)


def question_out(question: Question, assets: list[Asset] | None = None) -> QuestionOut:
    return QuestionOut.model_validate({
        "id": question.id, "document_id": question.document_id, "order_index": question.order_index,
        "original_number": question.original_number, "latex": question.latex, "ocr_latex": question.ocr_latex,
        "subquestions": question.subquestions, "source_pages": question.source_pages, "regions": question.regions,
        "topics": question.topics, "topic_source": question.topic_source, "review_status": question.review_status,
        "flags": question.flags,
        "ocr_confidence": float(question.ocr_confidence) if question.ocr_confidence is not None else None,
        "origin": question.origin, "version": question.version,
        "assets": [asset_out(a) for a in assets or []], "updated_at": question.updated_at,
    })


def document_summary(document: Document, question_count: int | None = None) -> DocumentSummaryOut:
    return DocumentSummaryOut.model_validate({
        "id": document.id, "filename": document.filename, "content_type": document.content_type,
        "size_bytes": document.size_bytes, "status": document.status, "page_count": document.page_count,
        "error_code": document.error_code, "error_message": document.error_message,
        "created_at": document.created_at, "question_count": question_count,
    })


def document_out(document: Document, pages: list[DocumentPage], questions: list[Question],
                 assets: dict[Any, list[Asset]], job: Job | None) -> DocumentOut:
    summary = document_summary(document, len(questions))
    return DocumentOut(
        **summary.model_dump(),
        pages=[PageOut(page_number=p.page_number, width=p.width, height=p.height,
                       image_url=f"{API}/documents/{document.id}/pages/{p.page_number}/image") for p in pages],
        page_results=[PageResultOut.model_validate(r) for r in document.page_results or []],
        questions=[question_out(q, assets.get(q.id)) for q in questions],
        job=job_out(job) if job else None,
    )


def _normalize(label: str) -> str:
    return "".join(ch for ch in label.lower() if ch.isalnum())


def solution_out(solution: Solution, question_version: int, *, hints_revealed: int = 0, revealed: bool = False,
                 can_reveal: bool = False, locked_reason: str | None = None,
                 figure_id: Any = None) -> SolutionOut:
    """Serialize a solution for one student. Unrevealed solutions carry statuses and opened hints only."""
    result = solution.result or {}
    all_hints = result.get("hints") or []
    model = result.get("solution") or {}
    verdicts = result.get("verdicts") or []
    by_label = {_normalize(v["label"]): v for v in verdicts}
    parts = []
    for part in model.get("parts", []):
        verdict = by_label.get(_normalize(part["label"]))
        if verdict is None and len(verdicts) == 1 and len(model.get("parts", [])) == 1:
            verdict = verdicts[0]
        parts.append({"label": part["label"], "answer_kind": part["answer_kind"],
                      "final_answer_latex": part["final_answer_latex"], "steps": part["steps"],
                      "verdict": {"status": verdict["status"], "reason_vi": verdict["reason_vi"]} if verdict else None})
    return SolutionOut.model_validate({
        "id": solution.id, "question_id": solution.question_id, "status": solution.status,
        "verification_status": solution.verification_status, "curriculum_status": solution.curriculum_status,
        "topics": [t for t in solution.topics if t in ("algebra", "geometry", "number_theory", "combinatorics")],
        "solved": model.get("solved"), "unsolved_reason_vi": model.get("unsolved_reason_vi"),
        "approach_vi": model.get("approach_vi") if revealed else None,
        "techniques": model.get("techniques", []) if revealed else [],
        "parts": parts if revealed else [],
        "evidence": [{k: e[k] for k in ("part", "kind", "outcome", "strength", "detail")}
                     for e in result.get("evidence") or []] if revealed else [],
        "curriculum_findings": (result.get("curriculum_findings") or []) if revealed else [],
        "figure_id": figure_id, "hints": all_hints[:hints_revealed], "hints_total": len(all_hints),
        "solution_revealed": revealed,
        "can_reveal_solution": can_reveal and not revealed, "reveal_locked_reason": None if revealed else locked_reason,
        "attempts": solution.attempts, "cost_sgd": solution.cost_sgd, "from_cache": solution.from_cache,
        "stale": solution.question_version != question_version, "policy_version": solution.policy_version,
        "pipeline_version": solution.pipeline_version, "error_code": solution.error_code,
        "error_message": solution.error_message, "created_at": solution.created_at,
        "updated_at": solution.updated_at,
    })


def solution_view_out(view: SolutionView) -> SolutionOut:
    access = view.access
    return solution_out(view.solution, view.question_version,
                        hints_revealed=access.hints_revealed if access else 0,
                        revealed=bool(access and access.solution_revealed_at),
                        can_reveal=view.decision.allowed, locked_reason=view.decision.reason_vi,
                        figure_id=view.figure_id)
