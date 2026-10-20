"""Versioned HTTP endpoints. Handlers translate HTTP ⇄ service calls; business logic lives in services."""

from __future__ import annotations

import uuid
from datetime import timedelta
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, File, Query, Request, Response, UploadFile, status
from sqlalchemy import func, select

from ...billing.budget import BudgetStatus
from ...documents import service
from ...errors import ErrorResponse, NotFound, NotImplementedYet, PayloadTooLarge
from ...models import Asset, DailyBudget, DocumentPage, Job, LlmCall, OcrCacheEntry, Question
from ...ocr.latex import normalize_latex
from ...security.tokens import create_guest, revoke_token
from ...security.turnstile import verify_turnstile
from ...storage.store import StorageError
from ..deps import AdminDep, ContainerDep, SessionDep, UserDep, bearer_token, client_ip
from . import schemas as s
from .serialize import document_out, document_summary, job_out, question_out

ERRORS: dict[int | str, dict[str, object]] = {
    code: {"model": ErrorResponse} for code in (400, 401, 402, 403, 404, 409, 413, 415, 422, 429, 503)
}
router = APIRouter(prefix="/api/v1", responses=ERRORS)

_NO_STORE = {"Cache-Control": "no-store"}


# --- Auth ---------------------------------------------------------------------------------------

@router.post("/auth/guest", response_model=s.SessionOut, status_code=201, tags=["auth"])
async def create_guest_session(body: s.GuestSessionIn, request: Request, c: ContainerDep,
                               session: SessionDep) -> s.SessionOut:
    ip = client_ip(request)
    await c.rate_limiter.hit(f"guest:{ip}", c.settings.rate_limit_guest_sessions_per_hour_per_ip, 3600)
    await verify_turnstile(c.settings, body.turnstile_token, ip, c.http)
    issued = await create_guest(session, c.settings.session_ttl_days)
    return s.SessionOut(token=issued.token, user_id=issued.user_id, expires_at=issued.expires_at)


@router.get("/auth/me", response_model=s.MeOut, tags=["auth"])
async def me(user_id: UserDep) -> s.MeOut:
    return s.MeOut(user_id=user_id)


@router.post("/auth/logout", status_code=204, tags=["auth"])
async def logout(session: SessionDep, token: Annotated[str | None, Depends(bearer_token)]) -> Response:
    if token:
        await revoke_token(session, token)
    return Response(status_code=204)


# --- Documents ----------------------------------------------------------------------------------

async def _read_limited(upload: UploadFile, limit: int) -> bytes:
    chunks: list[bytes] = []
    size = 0
    while chunk := await upload.read(1024 * 1024):
        size += len(chunk)
        if size > limit:
            raise PayloadTooLarge(f"Tệp quá lớn (tối đa {limit // (1024 * 1024)} MB).")
        chunks.append(chunk)
    return b"".join(chunks)


@router.post("/documents", response_model=s.UploadOut, status_code=202, tags=["documents"])
async def upload_document(user_id: UserDep, c: ContainerDep, session: SessionDep, response: Response,
                          file: Annotated[UploadFile, File(description="JPG, PNG, WebP hoặc PDF")]) -> s.UploadOut:
    await c.rate_limiter.hit(f"upload:{user_id}", c.settings.rate_limit_uploads_per_hour, 3600,
                             "Bạn đã tải lên quá nhiều tệp trong một giờ. Hãy thử lại sau.")
    data = await _read_limited(file, c.settings.max_upload_bytes)
    result = await service.upload_document(c, session, user_id, file.filename, data)
    if result.deduplicated:
        response.status_code = status.HTTP_200_OK
    return s.UploadOut(document=document_summary(result.document),
                       job=job_out(result.job) if result.job else None, deduplicated=result.deduplicated)


@router.get("/documents", response_model=list[s.DocumentSummaryOut], tags=["documents"])
async def list_documents(user_id: UserDep, session: SessionDep, response: Response) -> list[s.DocumentSummaryOut]:
    response.headers.update(_NO_STORE)
    documents = await service.list_documents(session, user_id)
    counts = dict((await session.execute(
        select(Question.document_id, func.count()).where(
            Question.document_id.in_([d.id for d in documents])).group_by(Question.document_id)
    )).tuples().all()) if documents else {}
    return [document_summary(d, counts.get(d.id, 0)) for d in documents]


@router.get("/documents/{document_id}", response_model=s.DocumentOut, tags=["documents"])
async def get_document(document_id: uuid.UUID, user_id: UserDep, session: SessionDep, response: Response
                       ) -> s.DocumentOut:
    response.headers.update(_NO_STORE)
    document = await service.get_owned_document(session, user_id, document_id)
    pages = await service.document_pages(session, document_id)
    questions = await service.document_questions(session, document_id)
    assets = await service.question_assets(session, [q.id for q in questions])
    job = await service.latest_job(session, document_id)
    return document_out(document, pages, questions, assets, job)


@router.delete("/documents/{document_id}", status_code=204, tags=["documents"])
async def delete_document(document_id: uuid.UUID, user_id: UserDep, c: ContainerDep, session: SessionDep
                          ) -> Response:
    await service.delete_document(c, session, user_id, document_id)
    return Response(status_code=204)


@router.post("/documents/{document_id}/reprocess", response_model=s.JobOut, status_code=202, tags=["documents"])
async def reprocess_document(document_id: uuid.UUID, body: s.ReprocessIn, user_id: UserDep, c: ContainerDep,
                             session: SessionDep) -> s.JobOut:
    await c.rate_limiter.hit(f"upload:{user_id}", c.settings.rate_limit_uploads_per_hour, 3600,
                             "Bạn đã yêu cầu nhận dạng quá nhiều lần trong một giờ. Hãy thử lại sau.")
    job = await service.reprocess_document(session, user_id, document_id, body.discard_edits)
    await session.refresh(job)
    return job_out(job)


@router.get("/documents/{document_id}/pages/{page_number}/image", tags=["documents"],
            response_class=Response, responses={200: {"content": {"image/png": {}, "image/jpeg": {}}}})
async def page_image(document_id: uuid.UUID, page_number: int, user_id: UserDep, c: ContainerDep,
                     session: SessionDep) -> Response:
    await service.get_owned_document(session, user_id, document_id)
    page = await session.scalar(select(DocumentPage).where(DocumentPage.document_id == document_id,
                                                           DocumentPage.page_number == page_number))
    if page is None:
        raise NotFound("Không tìm thấy trang.")
    return await _object_response(c, page.storage_key,
                                  "image/png" if page.storage_key.endswith(".png") else "image/jpeg")


@router.get("/assets/{asset_id}", tags=["documents"], response_class=Response,
            responses={200: {"content": {"image/png": {}}}})
async def get_asset(asset_id: uuid.UUID, user_id: UserDep, c: ContainerDep, session: SessionDep) -> Response:
    asset = await session.scalar(select(Asset).where(Asset.id == asset_id, Asset.owner_id == user_id))
    if asset is None:
        raise NotFound("Không tìm thấy hình.")
    return await _object_response(c, asset.storage_key, asset.content_type)


async def _object_response(c: ContainerDep, key: str, content_type: str) -> Response:
    try:
        data = await c.store.get(key)
    except StorageError as exc:
        raise NotFound("Không tìm thấy tệp.") from exc
    return Response(content=data, media_type=content_type, headers={
        "Cache-Control": "private, max-age=3600", "X-Content-Type-Options": "nosniff",
        "Content-Disposition": "inline", "Content-Security-Policy": "default-src 'none'"})


# --- Questions ----------------------------------------------------------------------------------

@router.get("/questions/{question_id}", response_model=s.QuestionOut, tags=["questions"])
async def get_question(question_id: uuid.UUID, user_id: UserDep, session: SessionDep) -> s.QuestionOut:
    question = await service.get_owned_question(session, user_id, question_id)
    assets = await service.question_assets(session, [question.id])
    return question_out(question, assets.get(question.id))


@router.patch("/questions/{question_id}", response_model=s.QuestionOut, tags=["questions"])
async def patch_question(question_id: uuid.UUID, body: s.QuestionPatchIn, user_id: UserDep, c: ContainerDep,
                         session: SessionDep) -> s.QuestionOut:
    await c.rate_limiter.hit(f"edit:{user_id}", c.settings.rate_limit_question_edits_per_minute, 60)
    changes = service.QuestionChanges(
        expected_version=body.expected_version, latex=body.latex,
        subquestions=[sq.model_dump() for sq in body.subquestions] if body.subquestions is not None else None,
        topics=list(body.topics) if body.topics is not None else None,
        original_number=body.original_number, set_original_number="original_number" in body.model_fields_set,
        review_status=body.review_status)
    question = await service.update_question(session, user_id, question_id, changes)
    assets = await service.question_assets(session, [question.id])
    return question_out(question, assets.get(question.id))


@router.delete("/questions/{question_id}", status_code=204, tags=["questions"])
async def delete_question(question_id: uuid.UUID, user_id: UserDep, session: SessionDep) -> Response:
    await service.delete_question(session, user_id, question_id)
    return Response(status_code=204)


@router.post("/documents/{document_id}/questions", response_model=s.QuestionOut, status_code=201,
             tags=["questions"])
async def create_question(document_id: uuid.UUID, body: s.QuestionCreateIn, user_id: UserDep, c: ContainerDep,
                          session: SessionDep) -> s.QuestionOut:
    await c.rate_limiter.hit(f"edit:{user_id}", c.settings.rate_limit_question_edits_per_minute, 60)
    question = await service.create_manual_question(session, user_id, document_id, body.latex,
                                                    body.original_number,
                                                    [sq.model_dump() for sq in body.subquestions])
    return question_out(question, [])


@router.post("/questions/{question_id}/solve", status_code=501, tags=["questions"],
             responses={501: {"model": ErrorResponse}})
async def solve_question(question_id: uuid.UUID, user_id: UserDep, session: SessionDep) -> Response:
    await service.get_owned_question(session, user_id, question_id)
    raise NotImplementedYet("Chức năng giải bài sẽ có trong Phase 3.")


@router.post("/latex/check", response_model=s.LatexCheckOut, tags=["questions"])
async def check_latex(body: s.LatexCheckIn, _: UserDep) -> s.LatexCheckOut:
    report = normalize_latex(body.latex)
    return s.LatexCheckOut(normalized=report.text,
                           issues=[s.FlagOut(code=i.code, severity=i.severity, message=i.message)
                                   for i in report.issues],
                           can_confirm=not report.has_errors)


# --- Jobs ---------------------------------------------------------------------------------------

@router.get("/jobs/{job_id}", response_model=s.JobOut, tags=["jobs"])
async def get_job(job_id: uuid.UUID, user_id: UserDep, session: SessionDep, response: Response) -> s.JobOut:
    response.headers.update(_NO_STORE)
    job = await session.scalar(select(Job).where(Job.id == job_id, Job.owner_id == user_id))
    if job is None:
        raise NotFound("Không tìm thấy tác vụ.")
    return job_out(job)


# --- Usage --------------------------------------------------------------------------------------

def _budget_out(b: BudgetStatus) -> s.BudgetOut:
    return s.BudgetOut(day=b.day, state=b.state.value, ceiling_sgd=b.ceiling_sgd, spent_sgd=b.spent_sgd,
                       reserved_sgd=b.reserved_sgd, warning_sgd=b.warning_sgd, restricted_sgd=b.restricted_sgd)


@router.get("/usage", response_model=s.UsageOut, tags=["usage"])
async def usage(user_id: UserDep, c: ContainerDep, session: SessionDep, response: Response) -> s.UsageOut:
    response.headers.update(_NO_STORE)
    budget = await c.budget.status()
    spent = await c.budget.user_total(session, user_id, budget.day)
    calls = await session.scalar(select(func.count()).select_from(LlmCall).where(
        LlmCall.user_id == user_id, LlmCall.day == budget.day)) or 0
    return s.UsageOut(budget=_budget_out(budget), me=s.MyUsageOut(
        spent_sgd=spent, calls=calls, daily_cap_sgd=c.settings.per_user_daily_budget_sgd))


@router.get("/admin/usage", response_model=s.AdminUsageOut, tags=["admin"])
async def admin_usage(admin: AdminDep, c: ContainerDep, session: SessionDep, response: Response,
                      days: Annotated[int, Query(ge=1, le=90)] = 14) -> s.AdminUsageOut:
    response.headers.update(_NO_STORE)
    budget = await c.budget.status()
    since = budget.day - timedelta(days=days - 1)
    day_rows = (await session.scalars(select(DailyBudget).where(DailyBudget.day >= since)
                                      .order_by(DailyBudget.day.desc()))).all()
    cost = func.coalesce(func.sum(func.coalesce(LlmCall.actual_sgd, LlmCall.reserved_sgd)), 0)

    async def breakdown(column: object) -> list[s.UsageBreakdownRow]:
        rows = (await session.execute(
            select(column, func.count(), cost, func.coalesce(func.sum(LlmCall.prompt_tokens), 0),
                   func.coalesce(func.sum(LlmCall.completion_tokens), 0))  # type: ignore[call-overload]
            .where(LlmCall.day == budget.day, LlmCall.status != "released").group_by(column)
        )).all()
        return [s.UsageBreakdownRow(key=str(r[0]), calls=r[1], cost_sgd=Decimal(r[2]), prompt_tokens=r[3],
                                    completion_tokens=r[4]) for r in rows]

    recent = (await session.scalars(select(LlmCall).order_by(LlmCall.created_at.desc()).limit(50))).all()
    cache_entries = await session.scalar(select(func.count()).select_from(OcrCacheEntry)) or 0
    cache_hits = await session.scalar(select(func.coalesce(func.sum(OcrCacheEntry.hits), 0))) or 0
    open_res = await session.scalar(select(func.count()).select_from(LlmCall).where(
        LlmCall.status == "reserved")) or 0
    return s.AdminUsageOut(
        budget=_budget_out(budget),
        days=[s.DailyUsageRow(day=d.day, ceiling_sgd=d.ceiling_sgd, spent_sgd=d.spent_sgd,
                              reserved_sgd=d.reserved_sgd) for d in day_rows],
        by_model=await breakdown(LlmCall.model), by_purpose=await breakdown(LlmCall.purpose),
        recent_calls=[s.RecentCallRow(id=r.id, created_at=r.created_at, purpose=r.purpose, model=r.model,
                                      status=r.status, outcome=r.outcome, reserved_sgd=r.reserved_sgd,
                                      actual_sgd=r.actual_sgd, prompt_tokens=r.prompt_tokens,
                                      completion_tokens=r.completion_tokens, latency_ms=r.latency_ms)
                      for r in recent],
        ocr_cache_entries=cache_entries, ocr_cache_hits=int(cache_hits), open_reservations=open_res,
        admin_email=admin.email)
