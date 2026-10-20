"""Upload → OCR job → review flow through the real API, worker, gateway, budget and cache."""

from __future__ import annotations

import json
from decimal import Decimal

import httpx
import pytest
from sqlalchemy import func, select

from app.container import Container
from app.models import LlmCall, OcrCacheEntry
from app.providers.base import ProviderError
from app.workers.runner import Worker
from tests.conftest import FIXTURES, ScriptedProvider, fixture_bytes, new_user, ocr_reply


def recorded(name: str) -> dict[str, object]:
    data: dict[str, object] = json.loads((FIXTURES / "ocr" / "recorded" / f"{name}.json").read_text())
    return data


async def upload(client: httpx.AsyncClient, headers: dict[str, str], name: str = "ocr/images/synthetic_exam.pdf",
                 filename: str = "de-thi.pdf") -> httpx.Response:
    return await client.post("/api/v1/documents", headers=headers,
                             files={"file": (filename, fixture_bytes(name), "application/octet-stream")})


async def drain(container: Container) -> None:
    worker = Worker(container)
    while await worker.run_one():
        pass


async def processed_document(client: httpx.AsyncClient, container: Container, provider: ScriptedProvider,
                             headers: dict[str, str]) -> dict[str, object]:
    provider.push(ocr_reply(recorded("synthetic_page1")))
    provider.push(ocr_reply(recorded("synthetic_page2")))
    container.settings.ocr_page_concurrency = 1  # deterministic page → reply order
    response = await upload(client, headers)
    assert response.status_code == 202, response.text
    await drain(container)
    doc_id = response.json()["document"]["id"]
    detail = await client.get(f"/api/v1/documents/{doc_id}", headers=headers)
    assert detail.status_code == 200
    body: dict[str, object] = detail.json()
    return body


async def test_full_flow(client: httpx.AsyncClient, container: Container, provider: ScriptedProvider,
                         auth: dict[str, str]) -> None:
    doc = await processed_document(client, container, provider, auth)
    assert doc["status"] == "needs_review"
    assert doc["page_count"] == 2
    assert [p["status"] for p in doc["page_results"]] == ["ok", "ok"]  # type: ignore[index, union-attr]
    questions = doc["questions"]
    assert isinstance(questions, list)
    assert [q["original_number"] for q in questions] == ["Câu 1", "Câu 2", "Câu 3", "Câu 4", "Câu 5"]
    q3 = questions[2]
    assert q3["review_status"] == "flagged"
    assert {"unclear_notation", "low_confidence"} <= {f["code"] for f in q3["flags"]}
    q5 = questions[4]
    assert q5["topics"] == ["geometry"] and len(q5["assets"]) == 1
    assert doc["job"]["status"] == "succeeded"  # type: ignore[index]

    # Page images and figure crops are served to the owner.
    page = await client.get(doc["pages"][0]["image_url"], headers=auth)  # type: ignore[index]
    assert page.status_code == 200 and page.headers["content-type"] == "image/png"
    assert "private" in page.headers["cache-control"]
    figure = await client.get(q5["assets"][0]["url"], headers=auth)
    assert figure.status_code == 200 and figure.content.startswith(b"\x89PNG")

    # OCR calls were metered and charged to the uploading user.
    async with container.db.sessionmaker() as session:
        calls = (await session.scalars(select(LlmCall))).all()
    assert len(calls) == 2 and all(c.purpose == "ocr_page" and c.status == "committed" for c in calls)
    usage = (await client.get("/api/v1/usage", headers=auth)).json()
    assert Decimal(usage["me"]["spent_sgd"]) > 0 and usage["me"]["calls"] == 2
    assert usage["budget"]["state"] == "normal"

    # The listing includes question counts.
    listing = (await client.get("/api/v1/documents", headers=auth)).json()
    assert listing[0]["question_count"] == 5


async def test_review_edit_confirm_and_conflicts(client: httpx.AsyncClient, container: Container,
                                                 provider: ScriptedProvider, auth: dict[str, str]) -> None:
    doc = await processed_document(client, container, provider, auth)
    q3 = doc["questions"][2]  # type: ignore[index]
    url = f"/api/v1/questions/{q3['id']}"

    blocked = await client.patch(url, headers=auth, json={"expected_version": 1, "review_status": "confirmed"})
    assert blocked.status_code == 422 and blocked.json()["error"]["code"] == "confirm_blocked"

    fixed_latex = q3["latex"].replace("\\unclear{2}", "2")
    edited = await client.patch(url, headers=auth, json={"expected_version": 1, "latex": fixed_latex})
    assert edited.status_code == 200, edited.text
    body = edited.json()
    assert body["version"] == 2 and body["latex"] == fixed_latex
    assert body["ocr_latex"] == q3["latex"]  # original OCR output preserved
    assert not {"unclear_notation", "low_confidence", "model_uncertain"} & {f["code"] for f in body["flags"]}
    assert body["review_status"] == "pending"

    stale = await client.patch(url, headers=auth, json={"expected_version": 1, "latex": "x"})
    assert stale.status_code == 409 and stale.json()["error"]["details"]["current_version"] == 2

    confirmed = await client.patch(url, headers=auth, json={"expected_version": 2, "review_status": "confirmed",
                                                            "topics": ["number_theory", "algebra"]})
    assert confirmed.status_code == 200
    assert confirmed.json()["review_status"] == "confirmed"
    assert confirmed.json()["topics"] == ["number_theory", "algebra"]
    assert confirmed.json()["topic_source"] == "student"

    # Editing a confirmed question sends it back to review.
    reopened = await client.patch(url, headers=auth, json={"expected_version": 3, "latex": fixed_latex + " "})
    assert reopened.json()["review_status"] == "confirmed"  # whitespace-only change normalises to the same text
    reopened = await client.patch(url, headers=auth, json={"expected_version": 4, "latex": fixed_latex + " Xét $n$."})
    assert reopened.json()["review_status"] == "pending"

    invalid = await client.patch(url, headers=auth, json={"expected_version": 5, "latex": "Cho $\\frac{1}{2$"})
    assert invalid.status_code == 200
    assert "unbalanced_braces" in {f["code"] for f in invalid.json()["flags"]}
    assert invalid.json()["review_status"] == "flagged"


async def test_subquestion_edit_and_manual_question(client: httpx.AsyncClient, container: Container,
                                                    provider: ScriptedProvider, auth: dict[str, str]) -> None:
    doc = await processed_document(client, container, provider, auth)
    q4 = doc["questions"][3]  # type: ignore[index]
    subs = q4["subquestions"] + [{"label": "c)", "latex": "Tính $x^3 + y^3$."}]
    response = await client.patch(f"/api/v1/questions/{q4['id']}", headers=auth,
                                  json={"expected_version": 1, "subquestions": subs})
    assert [s["label"] for s in response.json()["subquestions"]] == ["a)", "b)", "c)"]

    created = await client.post(f"/api/v1/documents/{doc['id']}/questions", headers=auth,
                                json={"latex": "Cho đường tròn $(O)$ và dây $AB$.", "original_number": "Câu 6"})
    assert created.status_code == 201
    assert created.json()["origin"] == "manual" and created.json()["order_index"] == 6
    assert created.json()["topics"] == ["geometry"]

    assert (await client.delete(f"/api/v1/questions/{created.json()['id']}", headers=auth)).status_code == 204


async def test_users_cannot_access_each_others_data(client: httpx.AsyncClient, container: Container,
                                                    provider: ScriptedProvider, auth: dict[str, str]) -> None:
    doc = await processed_document(client, container, provider, auth)
    q = doc["questions"][4]  # type: ignore[index]
    intruder = await new_user(client)
    paths = [
        ("GET", f"/api/v1/documents/{doc['id']}"),
        ("GET", doc["pages"][0]["image_url"]),  # type: ignore[index]
        ("GET", q["assets"][0]["url"]),
        ("GET", f"/api/v1/questions/{q['id']}"),
        ("GET", f"/api/v1/jobs/{doc['job']['id']}"),  # type: ignore[index]
        ("DELETE", f"/api/v1/documents/{doc['id']}"),
        ("DELETE", f"/api/v1/questions/{q['id']}"),
        ("POST", f"/api/v1/documents/{doc['id']}/reprocess"),
        ("POST", f"/api/v1/documents/{doc['id']}/questions"),
        ("POST", f"/api/v1/questions/{q['id']}/solve"),
    ]
    for method, path in paths:
        kwargs: dict[str, object] = {}
        if method == "POST":
            kwargs["json"] = {"latex": "x", "discard_edits": True}
        response = await client.request(method, path, headers=intruder, **kwargs)  # type: ignore[arg-type]
        assert response.status_code == 404, (method, path, response.status_code)
    patch = await client.patch(f"/api/v1/questions/{q['id']}", headers=intruder,
                               json={"expected_version": 1, "latex": "hacked"})
    assert patch.status_code == 404
    assert (await client.get("/api/v1/documents", headers=intruder)).json() == []
    # The owner's data is untouched.
    assert (await client.get(f"/api/v1/questions/{q['id']}", headers=auth)).json()["latex"] == q["latex"]


async def test_duplicate_upload_is_deduplicated(client: httpx.AsyncClient, container: Container,
                                                provider: ScriptedProvider, auth: dict[str, str]) -> None:
    await processed_document(client, container, provider, auth)
    again = await upload(client, auth)
    assert again.status_code == 200 and again.json()["deduplicated"] is True and again.json()["job"] is None


async def test_ocr_cache_shares_results_without_new_calls(client: httpx.AsyncClient, container: Container,
                                                          provider: ScriptedProvider, auth: dict[str, str]) -> None:
    await processed_document(client, container, provider, auth)
    other = await new_user(client)
    response = await upload(client, other)
    assert response.status_code == 202
    await drain(container)
    doc = (await client.get(f"/api/v1/documents/{response.json()['document']['id']}", headers=other)).json()
    assert [p["status"] for p in doc["page_results"]] == ["cached", "cached"]
    assert len(doc["questions"]) == 5
    assert len(provider.requests) == 2  # only the first upload called the model
    async with container.db.sessionmaker() as session:
        assert await session.scalar(select(func.sum(OcrCacheEntry.hits))) == 2


async def test_upload_validation(client: httpx.AsyncClient, container: Container, auth: dict[str, str]) -> None:
    unsupported = await client.post("/api/v1/documents", headers=auth,
                                    files={"file": ("x.png", b"GIF89a fake", "image/png")})
    assert unsupported.status_code == 415 and unsupported.json()["error"]["code"] == "unsupported_media_type"
    encrypted = await upload(client, auth, "ocr/images/encrypted.pdf")
    assert encrypted.status_code == 422 and encrypted.json()["error"]["code"] == "encrypted_pdf"
    container.settings.max_upload_bytes = 1000
    too_big = await upload(client, auth)
    assert too_big.status_code == 413
    empty = await client.post("/api/v1/documents", headers=auth, files={"file": ("x.pdf", b"", "application/pdf")})
    assert empty.status_code == 422


async def test_filename_is_sanitised(client: httpx.AsyncClient, auth: dict[str, str]) -> None:
    response = await upload(client, auth, "ocr/images/synthetic_page1.png", filename='../../<script>"a.png')
    name = response.json()["document"]["filename"]
    assert not set('/\\<>"') & set(name) and name.endswith("a.png")


async def test_budget_exhaustion_fails_document_with_vietnamese_message(
        client: httpx.AsyncClient, container: Container, provider: ScriptedProvider, auth: dict[str, str]) -> None:
    await container.budget.reserve(amount_sgd=Decimal("9.9999"), purpose="x", provider="soclaas", model="m",
                                   tier="fast", user_id=None)
    response = await upload(client, auth)
    await drain(container)
    doc = (await client.get(f"/api/v1/documents/{response.json()['document']['id']}", headers=auth)).json()
    assert doc["status"] == "failed"
    assert doc["error_code"] == "budget_exceeded"
    assert "ngân sách" in doc["error_message"]
    assert provider.requests == []


async def test_provider_outage_retries_then_fails_cleanly(client: httpx.AsyncClient, container: Container,
                                                          provider: ScriptedProvider, auth: dict[str, str]) -> None:
    for _ in range(20):
        provider.push(ProviderError("server_error", "down", status=503))
    response = await upload(client, auth, "ocr/images/synthetic_page1.png", "a.png")
    worker = Worker(container)
    assert await worker.run_one()
    job = (await client.get(f"/api/v1/jobs/{response.json()['job']['id']}", headers=auth)).json()
    assert job["status"] == "queued" and job["attempts"] == 1  # requeued with backoff
    from sqlalchemy import update

    from app.models import Job
    async with container.db.sessionmaker() as session:
        await session.execute(update(Job).values(run_after=func.now()))
        await session.commit()
    assert await worker.run_one()
    job = (await client.get(f"/api/v1/jobs/{job['id']}", headers=auth)).json()
    assert job["status"] == "failed" and job["error_code"] == "model_call_failed"
    doc = (await client.get(f"/api/v1/documents/{response.json()['document']['id']}", headers=auth)).json()
    assert doc["status"] == "failed"


async def test_partial_page_failure_keeps_successful_pages(client: httpx.AsyncClient, container: Container,
                                                           provider: ScriptedProvider, auth: dict[str, str]) -> None:
    container.settings.ocr_page_concurrency = 1
    provider.push(ocr_reply(recorded("synthetic_page1")))
    provider.push("this is not json")
    provider.push("still not json")
    response = await upload(client, auth)
    await drain(container)
    doc = (await client.get(f"/api/v1/documents/{response.json()['document']['id']}", headers=auth)).json()
    assert doc["status"] == "needs_review"
    assert [p["status"] for p in doc["page_results"]] == ["ok", "failed"]
    assert doc["page_results"][1]["error_code"] == "invalid_model_output"
    assert len(doc["questions"]) == 4


async def test_reprocess_requires_consent_when_edits_exist(client: httpx.AsyncClient, container: Container,
                                                           provider: ScriptedProvider, auth: dict[str, str]) -> None:
    doc = await processed_document(client, container, provider, auth)
    q1 = doc["questions"][0]  # type: ignore[index]
    await client.patch(f"/api/v1/questions/{q1['id']}", headers=auth,
                       json={"expected_version": 1, "review_status": "confirmed"})
    refused = await client.post(f"/api/v1/documents/{doc['id']}/reprocess", headers=auth, json={})
    assert refused.status_code == 409 and refused.json()["error"]["code"] == "edits_would_be_lost"
    accepted = await client.post(f"/api/v1/documents/{doc['id']}/reprocess", headers=auth,
                                 json={"discard_edits": True})
    assert accepted.status_code == 202
    busy = await client.post(f"/api/v1/documents/{doc['id']}/reprocess", headers=auth, json={"discard_edits": True})
    assert busy.status_code == 409
    await drain(container)  # cached pages: no new model calls
    after = (await client.get(f"/api/v1/documents/{doc['id']}", headers=auth)).json()
    assert len(after["questions"]) == 5 and all(q["version"] == 1 for q in after["questions"])
    assert len(provider.requests) == 2


async def test_delete_document_removes_files(client: httpx.AsyncClient, container: Container,
                                             provider: ScriptedProvider, auth: dict[str, str]) -> None:
    doc = await processed_document(client, container, provider, auth)
    image_url = doc["pages"][0]["image_url"]  # type: ignore[index]
    assert (await client.delete(f"/api/v1/documents/{doc['id']}", headers=auth)).status_code == 204
    assert (await client.get(f"/api/v1/documents/{doc['id']}", headers=auth)).status_code == 404
    assert (await client.get(image_url, headers=auth)).status_code == 404
    root = container.settings.storage_local_dir
    assert not any(p.is_file() for p in root.rglob("*")) if root.exists() else True


async def test_latex_check_endpoint(client: httpx.AsyncClient, auth: dict[str, str]) -> None:
    ok = (await client.post("/api/v1/latex/check", headers=auth, json={"latex": "Cho $a ≤ b$"})).json()
    assert ok == {"normalized": "Cho $a \\le b$", "issues": [], "can_confirm": True}
    bad = (await client.post("/api/v1/latex/check", headers=auth, json={"latex": "$x = \\unclear{1}$"})).json()
    assert bad["can_confirm"] is False


async def test_solve_is_explicitly_not_implemented(client: httpx.AsyncClient, container: Container,
                                                   provider: ScriptedProvider, auth: dict[str, str]) -> None:
    doc = await processed_document(client, container, provider, auth)
    response = await client.post(f"/api/v1/questions/{doc['questions'][0]['id']}/solve", headers=auth)  # type: ignore[index]
    assert response.status_code == 501 and response.json()["error"]["code"] == "not_implemented"


@pytest.mark.parametrize("kind", ["image"])
async def test_ocr_not_configured_fails_explicitly(client: httpx.AsyncClient, container: Container,
                                                   auth: dict[str, str], kind: str) -> None:
    container.ocr = None
    response = await upload(client, auth, "ocr/images/synthetic_page1.png", "a.png")
    await drain(container)
    doc = (await client.get(f"/api/v1/documents/{response.json()['document']['id']}", headers=auth)).json()
    assert doc["status"] == "failed" and doc["error_code"] == "ocr_not_configured"


async def test_oversized_or_unsized_upload_rejected_before_parsing(client: httpx.AsyncClient, container: Container,
                                                                  auth: dict[str, str]) -> None:
    container.settings.max_upload_bytes = 1000
    huge = await client.post("/api/v1/documents", headers={**auth, "Content-Length": str(10**9),
                                                           "Content-Type": "multipart/form-data; boundary=x"},
                             content=b"--x--")
    assert huge.status_code == 413

    async def chunks():  # type: ignore[no-untyped-def]
        yield b"--x--"

    multipart = {"Content-Type": "multipart/form-data; boundary=x"}
    unsized = await client.post("/api/v1/documents", headers={**auth, **multipart}, content=chunks())
    assert unsized.status_code == 411
