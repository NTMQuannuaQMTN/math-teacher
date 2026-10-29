"""Solve API: confirmation gate, async job, stored verdicts, cache, staleness, ownership, budget, rate limits."""

from __future__ import annotations

import json
from decimal import Decimal
from typing import Any

import httpx

from app.container import Container
from app.workers.runner import Worker
from tests.conftest import ScriptedProvider, new_user
from tests.test_api_documents import processed_document
from tests.test_solving import FORMAL_REPLY, GOOD, NON_COMPLIANT, WRONG


async def revealed(client: httpx.AsyncClient, q: dict[str, Any], headers: dict[str, str]) -> dict[str, Any]:
    """Open one hint (required first), then reveal the full solution."""
    assert (await client.post(f"/api/v1/questions/{q['id']}/hints/next", headers=headers)).status_code == 200
    response = await client.post(f"/api/v1/questions/{q['id']}/solution/reveal", headers=headers)
    assert response.status_code == 200, response.text
    body: dict[str, Any] = response.json()
    return body


async def drain(container: Container) -> None:
    worker = Worker(container)
    while await worker.run_one():
        pass


async def confirmed_question(client: httpx.AsyncClient, container: Container, provider: ScriptedProvider,
                             headers: dict[str, str]) -> dict[str, Any]:
    doc = await processed_document(client, container, provider, headers)
    q1: dict[str, Any] = doc["questions"][0]  # type: ignore[index]
    assert q1["original_number"] == "Câu 1"  # "Giải phương trình $x^2 - 5x + 6 = 0$."
    response = await client.patch(f"/api/v1/questions/{q1['id']}", headers=headers,
                                  json={"expected_version": q1["version"], "review_status": "confirmed"})
    assert response.status_code == 200, response.text
    confirmed: dict[str, Any] = response.json()
    return confirmed


async def test_unconfirmed_question_cannot_be_solved(client: httpx.AsyncClient, container: Container,
                                                     provider: ScriptedProvider, auth: dict[str, str]) -> None:
    doc = await processed_document(client, container, provider, auth)
    q3 = doc["questions"][2]  # type: ignore[index]
    response = await client.post(f"/api/v1/questions/{q3['id']}/solve", headers=auth, json={})
    assert response.status_code == 409 and response.json()["error"]["code"] == "question_not_confirmed"
    assert (await client.get(f"/api/v1/questions/{q3['id']}/solution", headers=auth)).status_code == 404


async def test_solve_flow_verified(client: httpx.AsyncClient, container: Container, provider: ScriptedProvider,
                                   auth: dict[str, str]) -> None:
    q = await confirmed_question(client, container, provider, auth)
    provider.push(FORMAL_REPLY)
    provider.push(GOOD)
    queued = await client.post(f"/api/v1/questions/{q['id']}/solve", headers=auth, json={})
    assert queued.status_code == 202, queued.text
    body = queued.json()
    assert body["solution"]["status"] == "queued" and body["job"]["kind"] == "solve_question"

    # Asking again while queued returns the same solution, no new job.
    again = await client.post(f"/api/v1/questions/{q['id']}/solve", headers=auth, json={})
    assert again.json()["solution"]["id"] == body["solution"]["id"]

    await drain(container)
    locked = (await client.get(f"/api/v1/questions/{q['id']}/solution", headers=auth)).json()
    assert locked["status"] == "done" and locked["verification_status"] == "VERIFIED"
    assert locked["parts"] == [] and locked["approach_vi"] is None and locked["evidence"] == []
    assert locked["hints"] == [] and locked["hints_total"] == 3 and locked["solution_revealed"] is False
    solution = await revealed(client, q, auth)
    assert solution["status"] == "done"
    assert solution["verification_status"] == "VERIFIED"
    assert solution["curriculum_status"] == "COMPLIANT"
    assert solution["parts"][0]["verdict"]["status"] == "VERIFIED"
    assert solution["evidence"][0]["strength"] == "exact"
    assert solution["stale"] is False and solution["attempts"] == 1
    assert Decimal(solution["cost_sgd"]) > 0
    job = (await client.get(f"/api/v1/jobs/{body['job']['id']}", headers=auth)).json()
    assert job["status"] == "succeeded"

    # A finished solution is returned directly (200) without another model call.
    calls = len(provider.requests)
    done = await client.post(f"/api/v1/questions/{q['id']}/solve", headers=auth, json={})
    assert done.status_code == 200 and done.json()["job"] is None
    assert len(provider.requests) == calls


async def test_verified_solution_is_shared_through_the_cache(client: httpx.AsyncClient, container: Container,
                                                             provider: ScriptedProvider, auth: dict[str, str]) -> None:
    q = await confirmed_question(client, container, provider, auth)
    provider.push(FORMAL_REPLY)
    provider.push(GOOD)
    await client.post(f"/api/v1/questions/{q['id']}/solve", headers=auth, json={})
    await drain(container)

    other = await new_user(client)
    q_other = await confirmed_question(client, container, provider, other)  # same paper, OCR from cache
    calls = len(provider.requests)
    response = await client.post(f"/api/v1/questions/{q_other['id']}/solve", headers=other, json={})
    assert response.status_code == 200 and response.json()["cached"] is True
    assert response.json()["solution"]["verification_status"] == "VERIFIED"
    assert response.json()["solution"]["from_cache"] is True
    assert len(provider.requests) == calls


async def test_incorrect_results_are_not_shared(client: httpx.AsyncClient, container: Container,
                                                provider: ScriptedProvider, auth: dict[str, str]) -> None:
    container.settings.solve_max_revisions = 0
    q = await confirmed_question(client, container, provider, auth)
    provider.push(FORMAL_REPLY)
    provider.push(WRONG)
    await client.post(f"/api/v1/questions/{q['id']}/solve", headers=auth, json={})
    await drain(container)
    solution = (await client.get(f"/api/v1/questions/{q['id']}/solution", headers=auth)).json()
    assert solution["verification_status"] == "INCORRECT" and solution["hints_total"] == 0
    solution = (await client.post(f"/api/v1/questions/{q['id']}/solution/reveal", headers=auth)).json()
    assert "Thiếu nghiệm" in solution["parts"][0]["verdict"]["reason_vi"]

    other = await new_user(client)
    q_other = await confirmed_question(client, container, provider, other)
    provider.push(FORMAL_REPLY)
    provider.push(GOOD)
    response = await client.post(f"/api/v1/questions/{q_other['id']}/solve", headers=other, json={})
    assert response.status_code == 202 and response.json()["cached"] is False


async def test_non_compliant_result_is_reported(client: httpx.AsyncClient, container: Container,
                                                provider: ScriptedProvider, auth: dict[str, str]) -> None:
    container.settings.solve_max_revisions = 0
    q = await confirmed_question(client, container, provider, auth)
    provider.push(FORMAL_REPLY)
    provider.push(NON_COMPLIANT)
    await client.post(f"/api/v1/questions/{q['id']}/solve", headers=auth, json={})
    await drain(container)
    solution = await revealed(client, q, auth)
    assert solution["verification_status"] == "VERIFIED"  # correctness and compliance are separate verdicts
    assert solution["curriculum_status"] == "NON_COMPLIANT"
    assert solution["curriculum_findings"][0]["rule_id"] == "calculus"


async def test_editing_the_question_marks_the_solution_stale(client: httpx.AsyncClient, container: Container,
                                                             provider: ScriptedProvider, auth: dict[str, str]) -> None:
    q = await confirmed_question(client, container, provider, auth)
    provider.push(FORMAL_REPLY)
    provider.push(GOOD)
    await client.post(f"/api/v1/questions/{q['id']}/solve", headers=auth, json={})
    await drain(container)
    edited = await client.patch(f"/api/v1/questions/{q['id']}", headers=auth,
                                json={"expected_version": q["version"], "topics": ["algebra", "number_theory"]})
    assert edited.status_code == 200
    solution = (await client.get(f"/api/v1/questions/{q['id']}/solution", headers=auth)).json()
    assert solution["stale"] is True


async def test_other_users_cannot_read_or_trigger_solutions(client: httpx.AsyncClient, container: Container,
                                                            provider: ScriptedProvider, auth: dict[str, str]) -> None:
    q = await confirmed_question(client, container, provider, auth)
    provider.push(FORMAL_REPLY)
    provider.push(GOOD)
    await client.post(f"/api/v1/questions/{q['id']}/solve", headers=auth, json={})
    await drain(container)
    intruder = await new_user(client)
    assert (await client.get(f"/api/v1/questions/{q['id']}/solution", headers=intruder)).status_code == 404
    assert (await client.post(f"/api/v1/questions/{q['id']}/solve", headers=intruder, json={})).status_code == 404


async def test_budget_exhaustion_fails_the_solution_with_vietnamese_message(
        client: httpx.AsyncClient, container: Container, provider: ScriptedProvider, auth: dict[str, str]) -> None:
    q = await confirmed_question(client, container, provider, auth)
    status = await container.budget.status()
    remaining = status.ceiling_sgd - status.spent_sgd - status.reserved_sgd - Decimal("0.000001")
    await container.budget.reserve(amount_sgd=remaining, purpose="x", provider="soclaas", model="m", tier="fast",
                                   user_id=None)
    calls = len(provider.requests)
    await client.post(f"/api/v1/questions/{q['id']}/solve", headers=auth, json={})
    await drain(container)
    solution = (await client.get(f"/api/v1/questions/{q['id']}/solution", headers=auth)).json()
    assert solution["status"] == "failed" and solution["error_code"] == "budget_exceeded"
    assert "ngân sách" in solution["error_message"]
    assert len(provider.requests) == calls


async def test_force_resolve_is_rate_limited(client: httpx.AsyncClient, container: Container,
                                             provider: ScriptedProvider, auth: dict[str, str]) -> None:
    container.settings.rate_limit_solves_per_hour = 2
    q = await confirmed_question(client, container, provider, auth)
    for _ in range(2):
        provider.push(FORMAL_REPLY)
        provider.push(GOOD)
        response = await client.post(f"/api/v1/questions/{q['id']}/solve", headers=auth, json={"force": True})
        assert response.status_code == 202
        await drain(container)
    limited = await client.post(f"/api/v1/questions/{q['id']}/solve", headers=auth, json={"force": True})
    assert limited.status_code == 429


async def test_solution_payload_is_valid_json_with_vietnamese_text(client: httpx.AsyncClient, container: Container,
                                                                   provider: ScriptedProvider,
                                                                   auth: dict[str, str]) -> None:
    q = await confirmed_question(client, container, provider, auth)
    provider.push(FORMAL_REPLY)
    provider.push(GOOD)
    await client.post(f"/api/v1/questions/{q['id']}/solve", headers=auth, json={})
    await drain(container)
    body = json.loads(json.dumps(await revealed(client, q, auth)))
    assert body["parts"][0]["final_answer_latex"].startswith("Vậy")
    assert "formalization" not in body  # internal templates are not exposed to students



async def test_hints_come_first_and_the_server_withholds_the_solution(
        client: httpx.AsyncClient, container: Container, provider: ScriptedProvider, auth: dict[str, str]) -> None:
    q = await confirmed_question(client, container, provider, auth)
    provider.push(FORMAL_REPLY)
    provider.push(GOOD)
    await client.post(f"/api/v1/questions/{q['id']}/solve", headers=auth, json={})
    await drain(container)
    url = f"/api/v1/questions/{q['id']}"

    locked = (await client.get(f"{url}/solution", headers=auth)).json()
    assert locked["can_reveal_solution"] is False and "gợi ý" in locked["reveal_locked_reason"]
    refused = await client.post(f"{url}/solution/reveal", headers=auth)
    assert refused.status_code == 409 and refused.json()["error"]["code"] == "solution_locked"
    assert "x = 2" not in refused.text

    first = (await client.post(f"{url}/hints/next", headers=auth)).json()
    assert [h["level"] for h in first["hints"]] == ["concept"]
    assert first["can_reveal_solution"] is True and first["parts"] == []
    second = (await client.post(f"{url}/hints/next", headers=auth)).json()
    assert len(second["hints"]) == 2
    await client.post(f"{url}/hints/next", headers=auth)
    exhausted = await client.post(f"{url}/hints/next", headers=auth)
    assert exhausted.status_code == 409 and exhausted.json()["error"]["code"] == "no_more_hints"

    shown = (await client.post(f"{url}/solution/reveal", headers=auth)).json()
    assert shown["solution_revealed"] is True and shown["parts"][0]["steps"]
    assert len(shown["hints"]) == 3 and shown["can_reveal_solution"] is False
    again = (await client.get(f"{url}/solution", headers=auth)).json()  # the reveal persists
    assert again["solution_revealed"] is True and again["parts"]


async def test_reveal_state_is_per_student(client: httpx.AsyncClient, container: Container,
                                           provider: ScriptedProvider, auth: dict[str, str]) -> None:
    q = await confirmed_question(client, container, provider, auth)
    provider.push(FORMAL_REPLY)
    provider.push(GOOD)
    await client.post(f"/api/v1/questions/{q['id']}/solve", headers=auth, json={})
    await drain(container)
    await revealed(client, q, auth)

    other = await new_user(client)
    assert (await client.post(f"/api/v1/questions/{q['id']}/hints/next", headers=other)).status_code == 404
    q_other = await confirmed_question(client, container, provider, other)
    cached = (await client.post(f"/api/v1/questions/{q_other['id']}/solve", headers=other, json={})).json()
    assert cached["cached"] is True
    assert cached["solution"]["solution_revealed"] is False and cached["solution"]["parts"] == []
    assert cached["solution"]["hints_total"] == 3 and cached["solution"]["hints"] == []


async def test_hint_gate_can_be_disabled(client: httpx.AsyncClient, container: Container,
                                         provider: ScriptedProvider, auth: dict[str, str]) -> None:
    container.settings.hints_before_solution = False
    q = await confirmed_question(client, container, provider, auth)
    provider.push(FORMAL_REPLY)
    provider.push(GOOD)
    await client.post(f"/api/v1/questions/{q['id']}/solve", headers=auth, json={})
    await drain(container)
    response = await client.post(f"/api/v1/questions/{q['id']}/solution/reveal", headers=auth)
    assert response.status_code == 200 and response.json()["parts"]
