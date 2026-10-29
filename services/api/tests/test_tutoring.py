"""Adaptive tutoring: step checks, tool overrides of the model, leak/curriculum safety, sessions and limits."""

from __future__ import annotations

import json
from typing import Any

import httpx
import pytest

from app.container import Container
from app.tools import checks
from tests.conftest import ScriptedProvider, new_user
from tests.test_api_solve import confirmed_question, drain
from tests.test_solving import FORMAL_REPLY, GOOD


@pytest.mark.parametrize(("previous", "current", "outcome"), [
    ("x^2 = 2*x", "x = 2", "refuted"),                       # divided by x: lost x = 0
    ("x^2-5*x+6=0", "(x-2)*(x-3)=0", "confirmed"),
    ("2*x+4=10", "x=4", "refuted"),                          # arithmetic slip
    ("sqrt(x+3) = x-3", "x+3 = (x-3)^2", "confirmed"),       # squaring: allowed, gains a root (reported)
    ("(x+1)^2", "x^2+2*x+1", "confirmed"),
    ("(x+1)^2", "x^2+1", "refuted"),
])
def test_step_checker(previous: str, current: str, outcome: str) -> None:
    result = checks.check_step({"variables": ["x"], "previous": previous, "current": current})
    assert result["outcome"] == outcome


def test_squaring_reports_extraneous_root() -> None:
    result = checks.check_step({"variables": ["x"], "previous": "sqrt(x+3) = x-3", "current": "x+3 = (x-3)^2"})
    assert result["data"]["gained"] == ["1"] and "ngoại lai" in result["detail"]


def feedback(**overrides: Any) -> str:
    base = {
        "approach_vi": "Em phân tích thành nhân tử.", "variable": "x",
        "steps": [{"text": "$x^2-5x+6=0$", "math": "x^2-5*x+6=0", "status": "correct", "note_vi": None},
                  {"text": "$(x-2)(x-3)=0$", "math": "(x-2)*(x-3)=0", "status": "correct", "note_vi": None}],
        "first_error_index": None, "error_explanation_vi": None,
        "next_hint_vi": "Bây giờ em xét từng nhân tử bằng $0$.", "student_reached_answer": False,
        "encouragement_vi": "Em làm tốt lắm!"}
    base.update(overrides)
    return json.dumps(base, ensure_ascii=False)


async def solved_session(client: httpx.AsyncClient, container: Container, provider: ScriptedProvider,
                         headers: dict[str, str]) -> tuple[dict[str, Any], dict[str, Any]]:
    q = await confirmed_question(client, container, provider, headers)
    provider.push(FORMAL_REPLY)
    provider.push(GOOD)
    await client.post(f"/api/v1/questions/{q['id']}/solve", headers=headers, json={})
    await drain(container)
    response = await client.post("/api/v1/sessions", headers=headers, json={"question_id": q["id"]})
    assert response.status_code == 201, response.text
    return q, response.json()


async def test_session_requires_a_solved_question(client: httpx.AsyncClient, container: Container,
                                                  provider: ScriptedProvider, auth: dict[str, str]) -> None:
    q = await confirmed_question(client, container, provider, auth)
    response = await client.post("/api/v1/sessions", headers=auth, json={"question_id": q["id"]})
    assert response.status_code == 404  # no solution yet


async def test_feedback_turn_with_tool_checked_steps(client: httpx.AsyncClient, container: Container,
                                                     provider: ScriptedProvider, auth: dict[str, str]) -> None:
    _, session = await solved_session(client, container, provider, auth)
    provider.push(feedback())
    response = await client.post(f"/api/v1/sessions/{session['id']}/messages", headers=auth,
                                 json={"content": "$x^2-5x+6=0 \\Leftrightarrow (x-2)(x-3)=0$"})
    assert response.status_code == 200, response.text
    body = response.json()
    student, tutor = body["messages"]
    assert student["role"] == "student" and tutor["role"] == "tutor"
    assert tutor["feedback"]["tool_checked_steps"] == 1
    assert tutor["feedback"]["first_error_index"] is None
    assert body["solution"]["parts"] == []  # the full solution stays withheld during tutoring
    request = next(r for r in provider.requests if r.schema_name == "work_feedback")
    assert request.thinking is False


async def test_tools_override_a_model_that_misses_a_lost_root(client: httpx.AsyncClient, container: Container,
                                                             provider: ScriptedProvider, auth: dict[str, str]) -> None:
    _, session = await solved_session(client, container, provider, auth)
    provider.push(feedback(steps=[
        {"text": "$x^2 = 2x$", "math": "x^2 = 2*x", "status": "correct", "note_vi": None},
        {"text": "$x = 2$", "math": "x = 2", "status": "correct", "note_vi": None}]))
    body = (await client.post(f"/api/v1/sessions/{session['id']}/messages", headers=auth,
                              json={"content": "Chia hai vế cho $x$: $x = 2$."})).json()
    fb = body["messages"][-1]["feedback"]
    assert fb["first_error_index"] == 1 and fb["steps"][1]["status"] == "incorrect"
    assert "mất nghiệm 0" in fb["error_explanation_vi"]


async def test_leaking_hint_is_replaced_by_a_prepared_hint(client: httpx.AsyncClient, container: Container,
                                                          provider: ScriptedProvider, auth: dict[str, str]) -> None:
    _, session = await solved_session(client, container, provider, auth)
    provider.push(feedback(next_hint_vi="Đáp số là $x = 2$ hoặc $x = 3$."))
    body = (await client.post(f"/api/v1/sessions/{session['id']}/messages", headers=auth,
                              json={"content": "Em chưa biết làm."})).json()
    hint = body["messages"][-1]["feedback"]["next_hint_vi"]
    assert "x = 2" not in hint and "tam thức" in hint  # the first prepared hint from the solution


async def test_prohibited_method_in_hint_is_replaced(client: httpx.AsyncClient, container: Container,
                                                     provider: ScriptedProvider, auth: dict[str, str]) -> None:
    _, session = await solved_session(client, container, provider, auth)
    provider.push(feedback(next_hint_vi="Em hãy dùng đạo hàm để tìm cực trị."))
    body = (await client.post(f"/api/v1/sessions/{session['id']}/messages", headers=auth,
                              json={"content": "Bài làm."})).json()
    assert "đạo hàm" not in body["messages"][-1]["feedback"]["next_hint_vi"]


async def test_session_hint_and_persistence(client: httpx.AsyncClient, container: Container,
                                            provider: ScriptedProvider, auth: dict[str, str]) -> None:
    _, session = await solved_session(client, container, provider, auth)
    hinted = (await client.post(f"/api/v1/sessions/{session['id']}/hint", headers=auth)).json()
    assert len(hinted["solution"]["hints"]) == 1
    provider.push(feedback())
    await client.post(f"/api/v1/sessions/{session['id']}/messages", headers=auth, json={"content": "Bài làm."})
    again = (await client.get(f"/api/v1/sessions/{session['id']}", headers=auth)).json()
    assert len(again["messages"]) == 2 and len(again["solution"]["hints"]) == 1
    # Creating the session again resumes it.
    resumed = (await client.post("/api/v1/sessions", headers=auth, json={"question_id": session["question_id"]})).json()
    assert resumed["id"] == session["id"]


async def test_daily_turn_limit_and_validation(client: httpx.AsyncClient, container: Container,
                                               provider: ScriptedProvider, auth: dict[str, str]) -> None:
    container.settings.tutoring_turns_per_day = 1
    _, session = await solved_session(client, container, provider, auth)
    url = f"/api/v1/sessions/{session['id']}/messages"
    assert (await client.post(url, headers=auth, json={"content": "   "})).status_code == 400
    provider.push(feedback())
    assert (await client.post(url, headers=auth, json={"content": "Bài làm."})).status_code == 200
    limited = await client.post(url, headers=auth, json={"content": "Bài làm 2."})
    assert limited.status_code == 402 and limited.json()["error"]["code"] == "tutoring_limit"


async def test_sessions_are_private(client: httpx.AsyncClient, container: Container, provider: ScriptedProvider,
                                    auth: dict[str, str]) -> None:
    q, session = await solved_session(client, container, provider, auth)
    intruder = await new_user(client)
    for method, path in [("GET", f"/api/v1/sessions/{session['id']}"),
                         ("POST", f"/api/v1/sessions/{session['id']}/hint"),
                         ("POST", f"/api/v1/sessions/{session['id']}/messages")]:
        kwargs: dict[str, Any] = {"json": {"content": "x"}} if path.endswith("messages") else {}
        assert (await client.request(method, path, headers=intruder, **kwargs)).status_code == 404
    assert (await client.post("/api/v1/sessions", headers=intruder, json={"question_id": q["id"]})).status_code == 404


async def test_first_step_is_checked_against_the_problem_and_errors_carry_forward(
        client: httpx.AsyncClient, container: Container, provider: ScriptedProvider, auth: dict[str, str]) -> None:
    """Live-model regression: "chia hai vế cho x" as the FIRST step, then a conclusion repeating the wrong result."""
    _, session = await solved_session(client, container, provider, auth)
    provider.push(feedback(problem_math="x^2 = 2*x", steps=[
        {"text": "Chia hai vế cho $x$: $x = 2$.", "math": "x = 2", "status": "correct", "note_vi": None},
        {"text": "Vậy $x = 2$.", "math": "x = 2", "status": "incorrect", "note_vi": "Thiếu nghiệm."}]))
    body = (await client.post(f"/api/v1/sessions/{session['id']}/messages", headers=auth,
                              json={"content": "Chia hai vế cho $x$: $x = 2$. Vậy $x = 2$."})).json()
    fb = body["messages"][-1]["feedback"]
    assert fb["first_error_index"] == 0 and "mất nghiệm 0" in fb["steps"][0]["note_vi"]
    assert fb["steps"][1]["status"] == "incorrect"  # not "fixed" by the tool: it carries the earlier error
    assert fb["tool_checked_steps"] == 2


# --- photos of notebook work -------------------------------------------------------------------

def notebook_png(seed: int = 0) -> bytes:
    import io

    from PIL import Image, ImageDraw
    image = Image.new("RGB", (600, 400), "white")
    ImageDraw.Draw(image).text((40, 40 + seed), "x^2 - 5x + 6 = 0  =>  (x-2)(x-3) = 0", fill="black")
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


WORK_READING = json.dumps({"page_kind": "handwritten", "confidence": 0.8,
                           "lines": ["Ta có $x^2-5x+6=0$", "$\\Leftrightarrow (x-2)(x-\\unclear{3})=0$"],
                           "uncertainties": [{"excerpt": "3", "reason": "3 hoặc 8"}]}, ensure_ascii=False)


async def test_work_photo_is_read_into_a_draft_and_cached(client: httpx.AsyncClient, container: Container,
                                                          provider: ScriptedProvider, auth: dict[str, str]) -> None:
    from app.providers.base import ImagePart

    _, session = await solved_session(client, container, provider, auth)
    provider.push(WORK_READING)
    files = {"file": ("vo.png", notebook_png(), "image/png")}
    response = await client.post(f"/api/v1/sessions/{session['id']}/work-photo", headers=auth, files=files)
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["pages"] == 1 and body["unclear"] == 1
    assert body["text"].splitlines()[0] == "Ta có $x^2-5x+6=0$"
    request = next(r for r in provider.requests if r.schema_name == "work_ocr")
    assert request.timeout_seconds == 75  # the student is waiting: one bounded attempt
    user = request.messages[1].content
    assert isinstance(user, list) and any(isinstance(p, ImagePart) for p in user)
    assert "KEEP EVERY MISTAKE" in str(request.messages[0].content)
    # Nothing was submitted: the session has no messages until the student sends the checked text.
    assert (await client.get(f"/api/v1/sessions/{session['id']}", headers=auth)).json()["messages"] == []

    calls = len(provider.requests)
    again = await client.post(f"/api/v1/sessions/{session['id']}/work-photo", headers=auth, files=files)
    assert again.status_code == 200 and again.json()["text"] == body["text"]
    assert len(provider.requests) == calls  # same page: read from the cache, no model call

    # Unclear readings must be fixed before the work reaches the tutor.
    blocked = await client.post(f"/api/v1/sessions/{session['id']}/messages", headers=auth,
                                json={"content": body["text"]})
    assert blocked.status_code == 400 and blocked.json()["error"]["code"] == "unclear_work"


async def test_work_photo_rejections(client: httpx.AsyncClient, container: Container, provider: ScriptedProvider,
                                     auth: dict[str, str]) -> None:
    _, session = await solved_session(client, container, provider, auth)
    url = f"/api/v1/sessions/{session['id']}/work-photo"
    provider.push(json.dumps({"page_kind": "blank", "lines": [], "uncertainties": [], "confidence": 0.9}))
    blank = await client.post(url, headers=auth, files={"file": ("trang.png", notebook_png(7), "image/png")})
    assert blank.status_code == 422 and blank.json()["error"]["code"] == "no_work_found"

    not_image = await client.post(url, headers=auth, files={"file": ("a.png", b"not an image", "image/png")})
    assert not_image.status_code == 415

    intruder = await new_user(client)
    other = await client.post(url, headers=intruder, files={"file": ("vo.png", notebook_png(), "image/png")})
    assert other.status_code == 404
