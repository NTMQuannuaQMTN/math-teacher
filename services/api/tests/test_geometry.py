"""Geometry DSL, engine (configurations, degeneracy, givens), symbolic prover, verification and figure API."""

from __future__ import annotations

import json
import math
from typing import Any

import httpx
import numpy as np
import pytest
from hypothesis import given, settings
from hypothesis import strategies as st
from pydantic import ValidationError

from app.container import Container
from app.geometry.dsl import GeometrySpec
from app.geometry.engine import (
    Degenerate,
    GeometryError,
    check_spec,
    compile_spec,
    evaluate,
    residuals,
    sample_configs,
    solve_givens,
)
from app.geometry.symbolic import prove_goals
from app.tools import checks
from tests.conftest import ScriptedProvider

P = {"kind": "free_point"}


def spec(objects: list[dict[str, Any]], **rest: Any) -> GeometrySpec:
    return GeometrySpec.model_validate({"objects": objects, **rest})


TRIANGLE = [{**P, "id": "A"}, {**P, "id": "B"}, {**P, "id": "C"}]


# --- DSL validation -----------------------------------------------------------------------------------------------

def test_unsupported_constructions_are_rejected_not_guessed() -> None:
    with pytest.raises(ValidationError):
        spec([{"kind": "spiral", "id": "S"}])
    with pytest.raises(ValidationError):
        spec([{"kind": "circle", "id": "w", "center": "O"}])  # neither through nor radius
    with pytest.raises(ValidationError, match="duplicate"):
        spec([{**P, "id": "A"}, {**P, "id": "A"}])


@pytest.mark.parametrize(("objects", "message"), [
    ([{**P, "id": "A"}, {"kind": "midpoint", "id": "M", "a": "A", "b": "Z"}], "unknown object 'Z'"),
    ([*TRIANGLE, {"kind": "line", "id": "d", "through": ["A", "B"]},
      {"kind": "midpoint", "id": "M", "a": "A", "b": "d"}], "must be a point"),
    ([{**P, "id": "A"}, {"kind": "point_on_line", "id": "X", "line": "A"}], "must be a line"),
    ([{"kind": "midpoint", "id": "M", "a": "N", "b": "N"}, {"kind": "midpoint", "id": "N", "a": "M", "b": "M"}],
     "circular"),
])
def test_reference_and_type_errors(objects: list[dict[str, Any]], message: str) -> None:
    with pytest.raises(GeometryError, match=message):
        compile_spec(spec(objects))


# --- engine -------------------------------------------------------------------------------------------------------

def test_known_theorems_hold_and_false_claims_are_refuted() -> None:
    s = spec([*TRIANGLE, {"kind": "circumcenter", "id": "O", "points": ["A", "B", "C"]},
              {"kind": "orthocenter", "id": "H", "points": ["A", "B", "C"]},
              {"kind": "centroid", "id": "G", "points": ["A", "B", "C"]},
              {"kind": "midpoint", "id": "M", "a": "B", "b": "C"}],
             goals=[{"kind": "collinear", "points": ["O", "G", "H"]},
                    {"kind": "perpendicular", "lines": [["O", "M"], ["B", "C"]]},
                    {"kind": "equal_length", "segments": [["O", "A"], ["O", "M"]]}])
    result = check_spec(s)
    assert [g["outcome"] for g in result["goals"]] == ["holds", "holds", "refuted"]
    assert result["goals"][2]["counterexample"]["A"]["type"] == "point"


def test_circle_intersections_tangents_and_branch_choice() -> None:
    s = spec([{**P, "id": "O"}, {**P, "id": "A"}, {"kind": "circle", "id": "w", "center": "O", "radius": 2},
              {"kind": "circle_diameter", "id": "k", "a": "O", "b": "A"},
              {"kind": "intersection", "id": "B", "of": ["w", "k"]},
              {"kind": "intersection", "id": "C", "of": ["w", "k"], "exclude": "B"},
              {"kind": "tangent", "id": "t", "circle": "w", "at": "B"}],
             givens=[{"kind": "length_value", "segment": ["O", "A"], "value": 5}],
             goals=[{"kind": "perpendicular", "lines": [["O", "A"], ["B", "C"]]},
                    {"kind": "on_line", "point": "A", "line": "t"},
                    {"kind": "equal_length", "segments": [["A", "B"], ["A", "C"]]}])
    result = check_spec(s)
    assert result["status"] == "ok"
    assert all(g["outcome"] == "holds" for g in result["goals"])
    values = result["initial"]["values"]
    assert values["B"] != values["C"]  # "exclude" picked the other intersection


def test_givens_are_solved_and_targets_measured() -> None:
    s = spec([*TRIANGLE, {"kind": "line", "id": "BC", "through": ["B", "C"]},
              {"kind": "projection", "id": "H", "point": "A", "line": "BC"}],
             givens=[{"kind": "angle_value", "angle": ["B", "A", "C"], "degrees": 90},
                     {"kind": "length_value", "segment": ["A", "B"], "value": 3},
                     {"kind": "length_value", "segment": ["A", "C"], "value": 4}],
             targets=[{"kind": "length", "points": ["A", "H"]}, {"kind": "area", "points": ["A", "B", "C"]}])
    result = check_spec(s)
    assert result["targets"][0]["constant"] and result["targets"][0]["value"] == pytest.approx(2.4)
    assert result["targets"][1]["value"] == pytest.approx(6)


def test_scale_free_target_is_not_constant() -> None:
    s = spec(TRIANGLE, givens=[{"kind": "angle_value", "angle": ["B", "A", "C"], "degrees": 90}],
             targets=[{"kind": "length", "points": ["B", "C"]}])
    assert check_spec(s)["targets"][0]["constant"] is False  # missing length data is detected, not guessed


def test_impossible_constraints_are_infeasible() -> None:
    s = spec(TRIANGLE, givens=[{"kind": "length_value", "segment": ["A", "B"], "value": 1},
                               {"kind": "length_value", "segment": ["B", "C"], "value": 1},
                               {"kind": "length_value", "segment": ["A", "C"], "value": 5}])
    assert check_spec(s)["status"] == "infeasible"


@pytest.mark.parametrize(("objects", "reason"), [
    ([{**P, "id": "A"}, {"kind": "line", "id": "d", "through": ["A", "A"]}], "trùng nhau"),
    ([*TRIANGLE, {"kind": "line", "id": "d1", "through": ["A", "B"]},
      {"kind": "parallel", "id": "d2", "through": "C", "to": "d1"},
      {"kind": "intersection", "id": "X", "of": ["d1", "d2"]}], "song song"),
])
def test_degenerate_constructions_name_the_culprit(objects: list[dict[str, Any]], reason: str) -> None:
    compiled = compile_spec(spec(objects))
    params = np.array([0.0, 0.0, 3.0, 1.0, 1.0, 4.0][: len(compiled.params)])
    with pytest.raises(Degenerate, match=reason):
        evaluate(compiled, params)


def test_line_missing_circle_is_degenerate() -> None:
    s = spec([{**P, "id": "O"}, {**P, "id": "P"}, {**P, "id": "Q"},
              {"kind": "circle", "id": "w", "center": "O", "radius": 1},
              {"kind": "line", "id": "d", "through": ["P", "Q"]},
              {"kind": "intersection", "id": "X", "of": ["d", "w"]}])
    with pytest.raises(Degenerate, match="không cắt"):
        evaluate(compile_spec(s), np.array([0, 0, 5, 5, 6, 5], dtype=float))


@settings(max_examples=25, deadline=None)
@given(st.lists(st.floats(-6, 6, allow_nan=False), min_size=6, max_size=6))
def test_drag_invariant_midpoint_and_projection(coords: list[float]) -> None:
    """Whatever the free points are (a drag), dependent points satisfy their definitions."""
    s = spec([*TRIANGLE, {"kind": "midpoint", "id": "M", "a": "B", "b": "C"},
              {"kind": "line", "id": "BC", "through": ["B", "C"]},
              {"kind": "projection", "id": "H", "point": "A", "line": "BC"}])
    compiled = compile_spec(s)
    try:
        values = evaluate(compiled, np.array(coords))
    except Degenerate:
        return  # B = C: correctly refused rather than drawn
    rels = [GeometrySpec.model_validate({"objects": s.model_dump()["objects"], "goals": [g]}).goals[0] for g in (
        {"kind": "equal_length", "segments": [["B", "M"], ["M", "C"]]},
        {"kind": "collinear", "points": ["B", "M", "C"]},
        {"kind": "perpendicular", "lines": [["A", "H"], ["B", "C"]]})]
    for rel in rels:
        if rel.kind == "perpendicular" and np.hypot(*(values["A"] - values["H"])) < 1e-6:  # type: ignore[operator]
            continue  # A on BC: AH has no direction
        assert max(abs(r) for r in residuals(rel, values)) < 1e-7


def test_drag_with_givens_keeps_constraints() -> None:
    """Dragging a free point re-solves the givens with that point held fixed (isosceles stays isosceles)."""
    s = spec(TRIANGLE, givens=[{"kind": "equal_length", "segments": [["A", "B"], ["A", "C"]]}])
    compiled = compile_spec(s)
    configs, _ = sample_configs(compiled, 1)
    dragged = configs[0].params.copy()
    dragged[compiled.param_index("A")] = [7.0, 3.0]
    solved = solve_givens(compiled, dragged, fixed=compiled.param_index("A"))
    assert solved is not None and list(solved[compiled.param_index("A")]) == [7.0, 3.0]
    values = evaluate(compiled, solved)
    assert max(abs(r) for r in residuals(s.givens[0], values)) < 1e-9


def test_angle_bisector_and_incenter_agree() -> None:
    s = spec([*TRIANGLE, {"kind": "angle_bisector", "id": "da", "vertex": "A", "a": "B", "b": "C"},
              {"kind": "incenter", "id": "I", "points": ["A", "B", "C"]}],
             goals=[{"kind": "on_line", "point": "I", "line": "da"},
                    {"kind": "equal_angle", "angles": [["B", "A", "I"], ["I", "A", "C"]]}])
    assert all(g["outcome"] == "holds" for g in check_spec(s)["goals"])


# --- symbolic -----------------------------------------------------------------------------------------------------

def test_symbolic_proof_for_rational_constructions() -> None:
    s = spec([*TRIANGLE, {"kind": "circumcenter", "id": "O", "points": ["A", "B", "C"]},
              {"kind": "orthocenter", "id": "H", "points": ["A", "B", "C"]},
              {"kind": "centroid", "id": "G", "points": ["A", "B", "C"]}],
             goals=[{"kind": "collinear", "points": ["O", "G", "H"]},
                    {"kind": "equal_length", "segments": [["O", "A"], ["O", "G"]]}])
    assert prove_goals(s) == [True, False]


def test_symbolic_not_attempted_with_circles_or_givens() -> None:
    with_circle = spec([{**P, "id": "O"}, {**P, "id": "A"}, {"kind": "circle", "id": "w", "center": "O",
                                                               "through": "A"}])
    assert prove_goals(with_circle) is None
    with_given = spec(TRIANGLE, givens=[{"kind": "equal_length", "segments": [["A", "B"], ["A", "C"]]}])
    assert prove_goals(with_given) is None


# --- verification integration -------------------------------------------------------------------------------------

def test_geometry_check_strengths() -> None:
    exact = checks.check_geometry({"spec": {"objects": [*TRIANGLE, {"kind": "midpoint", "id": "M", "a": "A",
                                                                     "b": "B"},
                                                         {"kind": "midpoint", "id": "N", "a": "A", "b": "C"}],
                                            "goals": [{"kind": "parallel", "lines": [["M", "N"], ["B", "C"]]}]}})
    assert exact["outcome"] == "confirmed" and exact["strength"] == "exact"
    sampled = checks.check_geometry({"spec": {"objects": [{**P, "id": "O"}, {**P, "id": "A"},
                                                           {"kind": "circle", "id": "w", "center": "O",
                                                            "through": "A"},
                                                           {"kind": "point_on_circle", "id": "B", "circle": "w"},
                                                           {"kind": "point_on_circle", "id": "C", "circle": "w"}],
                                              "goals": [{"kind": "equal_length", "segments": [["O", "B"],
                                                                                              ["O", "C"]]}]}})
    assert sampled["outcome"] == "confirmed" and sampled["strength"] == "sampled"


def test_geometry_target_answer_is_checked() -> None:
    base = {"objects": [*TRIANGLE, {"kind": "line", "id": "BC", "through": ["B", "C"]},
                        {"kind": "projection", "id": "H", "point": "A", "line": "BC"}],
            "givens": [{"kind": "angle_value", "angle": ["B", "A", "C"], "degrees": 90},
                       {"kind": "length_value", "segment": ["A", "B"], "value": 3},
                       {"kind": "length_value", "segment": ["A", "C"], "value": 4}],
            "targets": [{"kind": "length", "points": ["A", "H"]}]}
    assert checks.check_geometry({"spec": base, "expected": "12/5"})["outcome"] == "confirmed"
    assert checks.check_geometry({"spec": base, "expected": "5/2"})["outcome"] == "refuted"


async def test_geometry_proof_verdict_is_partial_at_most() -> None:
    from app.verification.verdict import verify_solution
    from tests.test_solving import formal, local_run, part, solution

    form = formal({"label": "", "task": "prove", "template": {"kind": "geometry", "spec": {
        "objects": [*TRIANGLE, {"kind": "midpoint", "id": "M", "a": "A", "b": "B"},
                    {"kind": "midpoint", "id": "N", "a": "A", "b": "C"}],
        "goals": [{"kind": "parallel", "lines": [["M", "N"], ["B", "C"]]}]}}})
    _, evidence, status = await verify_solution(form, solution(part(kind="proof")), local_run)
    assert evidence[0].strength == "exact" and status == "PARTIALLY_VERIFIED"


# --- figure API ---------------------------------------------------------------------------------------------------

FIGURE_FORMAL = json.dumps({"parts": [{"label": "", "task": "prove", "template": {"kind": "geometry", "spec": {
    "objects": [*TRIANGLE, {"kind": "circumcenter", "id": "O", "points": ["A", "B", "C"]},
                {"kind": "midpoint", "id": "M", "a": "B", "b": "C"}],
    "goals": [{"kind": "perpendicular", "lines": [["O", "M"], ["B", "C"]]}]}}}]})


async def test_figure_job_and_endpoints(client: httpx.AsyncClient, container: Container, provider: ScriptedProvider,
                                        auth: dict[str, str]) -> None:
    from tests.test_api_solve import confirmed_question, drain

    q = await confirmed_question(client, container, provider, auth)
    assert (await client.get(f"/api/v1/questions/{q['id']}/figure", headers=auth)).status_code == 404
    provider.push(FIGURE_FORMAL)
    pending = await client.post(f"/api/v1/questions/{q['id']}/figure", headers=auth)
    assert pending.status_code == 202 and pending.json()["status"] == "pending"
    await drain(container)
    figure = (await client.get(f"/api/v1/questions/{q['id']}/figure", headers=auth)).json()
    assert figure["status"] == "ok" and figure["spec"]["objects"][3]["id"] == "O"
    layout = figure["initial"]["layout"]
    assert [entry["object"] for entry in layout] == ["A", "A", "B", "B", "C", "C"]
    assert {"O", "M"} <= set(figure["initial"]["values"])
    same = await client.post(f"/api/v1/questions/{q['id']}/figure", headers=auth)
    assert same.status_code == 200 and same.json()["id"] == figure["id"]  # no second model call
    provider.push(FIGURE_FORMAL)
    redraw = await client.post(f"/api/v1/questions/{q['id']}/figure", headers=auth, json={"force": True})
    assert redraw.status_code == 202 and redraw.json()["id"] != figure["id"]  # "Vẽ lại hình": a fresh drawing
    again = await client.post(f"/api/v1/questions/{q['id']}/figure", headers=auth, json={"force": True})
    assert again.json()["id"] == redraw.json()["id"]  # a drawing in progress is not started twice
    await drain(container)
    assert (await client.get(f"/api/v1/questions/{q['id']}/figure", headers=auth)).json()["status"] == "ok"
    by_id = await client.get(f"/api/v1/geometry/{figure['id']}", headers=auth)
    assert by_id.status_code == 200
    from tests.conftest import new_user
    intruder = await new_user(client)
    assert (await client.get(f"/api/v1/geometry/{figure['id']}", headers=intruder)).status_code == 404


def test_later_parts_inherit_the_construction_and_the_figure_shows_every_goal() -> None:
    from app.geometry.service import geometry_spec
    from app.solvers.schemas import Formalization
    from app.verification.verdict import inherit_geometry, template_errors

    first = json.loads(FIGURE_FORMAL)["parts"][0]
    later = {"label": "b)", "task": "prove", "template": {"kind": "geometry", "spec": {
        "objects": [{"kind": "midpoint", "id": "N", "a": "A", "b": "C"}],
        "goals": [{"kind": "perpendicular", "lines": [["O", "N"], ["A", "C"]]}]}}}
    raw = Formalization.model_validate({"parts": [{**first, "label": "a)"}, later]})
    assert template_errors(raw)  # part b alone uses A, C and O without defining them
    formal = inherit_geometry(raw)
    assert template_errors(formal) == []
    figure = geometry_spec(formal)
    assert figure is not None
    assert [o["id"] for o in figure["objects"]] == ["A", "B", "C", "O", "M", "N"]
    assert [g["lines"][0] for g in figure["goals"]] == [["O", "M"], ["O", "N"]]
    # A part that repeats an object keeps its own definition.
    redefined = {**later, "template": {"kind": "geometry", "spec": {
        "objects": [{"kind": "midpoint", "id": "M", "a": "A", "b": "B"}], "goals": []}}}
    part_b = inherit_geometry(Formalization.model_validate({"parts": [first, redefined]})).parts[1].template
    assert part_b is not None and [o.model_dump()["b"] for o in part_b.spec.objects if o.id == "M"] == ["B"]


def test_formalizer_slips_are_rewritten_exactly() -> None:
    from app.geometry.engine import normalize_spec

    s = spec([*TRIANGLE, {"kind": "circumcircle", "id": "w", "points": ["A", "B", "C"]},
              {"kind": "point_on_circle", "id": "D", "circle": "w"},
              {"kind": "projection", "id": "H", "point": "A", "line": "BC"}],  # "BC" is never defined
             givens=[{"kind": "on_circle", "point": "A", "circle": "w"},
                     {"kind": "on_circle", "point": "D", "circle": "w"}])
    fixed = normalize_spec(s)
    assert fixed.givens == []  # both always true
    line = next(o for o in fixed.objects if o.id == "BC")
    assert line.model_dump()["through"] == ["B", "C"]
    compile_spec(fixed)
    circular = spec([{**P, "id": "B"}, {**P, "id": "C"}, {"kind": "point_on_circle", "id": "A", "circle": "w"},
                     {"kind": "circumcircle", "id": "w", "points": ["A", "B", "C"]}])
    with pytest.raises(GeometryError, match="circular"):
        compile_spec(circular)
    assert next(o for o in normalize_spec(circular).objects if o.id == "A").kind == "free_point"


def test_a_drawing_keeps_what_builds() -> None:
    from app.geometry.engine import drawable

    s = spec([*TRIANGLE, {"kind": "midpoint", "id": "M", "a": "B", "b": "C"},
              {"kind": "intersection", "id": "X", "of": ["dAM", "wXYZ"]},
              {"kind": "midpoint", "id": "N", "a": "X", "b": "A"}],
             goals=[{"kind": "collinear", "points": ["A", "M", "N"]},
                    {"kind": "on_circle", "point": "M", "circle": "nowhere"}])
    drawn = drawable(s)
    assert drawn is not None and [o.id for o in drawn.objects] == ["A", "B", "C", "M"]
    assert drawn.goals == []  # both goals use objects that were left out
    assert drawable(spec([{"kind": "midpoint", "id": "M", "a": "Q", "b": "R"}])) is None


def test_figure_skips_one_contradictory_given_and_says_so() -> None:
    circle = [{**P, "id": "O"}, {**P, "id": "A"}, {"kind": "circle", "id": "w", "center": "O", "through": "A"},
              {"kind": "point_on_circle", "id": "B", "circle": "w"}]
    good = {"kind": "angle_value", "angle": ["A", "O", "B"], "degrees": 90}
    result = checks.build_figure({"spec": {"objects": circle, "givens": [
        good, {"kind": "on_circle", "point": "O", "circle": "w"}]}})
    data = result["data"]
    assert data["status"] == "ok" and "on_circle" in result["detail"]
    assert data["spec"]["givens"] == [GeometrySpec.model_validate({"objects": circle, "givens": [good]})
                                      .model_dump(mode="json")["givens"][0]]


async def test_a_redraw_samples_a_fresh_formalization(client: httpx.AsyncClient, container: Container,
                                                      provider: ScriptedProvider, auth: dict[str, str]) -> None:
    from tests.test_api_solve import confirmed_question, drain

    q = await confirmed_question(client, container, provider, auth)
    provider.push(FIGURE_FORMAL)
    await client.post(f"/api/v1/questions/{q['id']}/figure", headers=auth)
    await drain(container)
    provider.push(FIGURE_FORMAL)
    await client.post(f"/api/v1/questions/{q['id']}/figure", headers=auth, json={"force": True})
    await drain(container)
    assert [r.temperature for r in provider.requests if r.schema_name == "formalization"][-2:] == [0.0, 0.4]


def test_figure_points_get_letter_names() -> None:
    """User request: auxiliary points are shown as M, A', A1 — never midAB or H_A."""
    from app.geometry.engine import name_points

    s = spec([*TRIANGLE, {"kind": "line", "id": "BC", "through": ["B", "C"]},
              {"kind": "midpoint", "id": "midBC", "a": "B", "b": "C"},
              {"kind": "projection", "id": "H_A", "point": "A", "line": "BC"},
              {"kind": "projection", "id": "footA", "point": "A", "line": "BC"},
              {"kind": "midpoint", "id": "M", "a": "A", "b": "B"}],
             goals=[{"kind": "collinear", "points": ["B", "midBC", "C"]}])
    named = name_points(s)
    ids = [o.id for o in named.objects]
    assert ids == ["A", "B", "C", "BC", "N", "A'", "A1", "M"]  # M is taken, so the midpoint of BC becomes N
    assert named.goals[0].model_dump()["points"] == ["B", "N", "C"]
    assert named.objects[5].model_dump()["point"] == "A"  # references keep pointing at the right objects
    compile_spec(named)


async def test_unsupported_geometry_is_reported(client: httpx.AsyncClient, container: Container,
                                                provider: ScriptedProvider, auth: dict[str, str]) -> None:
    from tests.test_api_solve import confirmed_question, drain

    q = await confirmed_question(client, container, provider, auth)
    provider.push(json.dumps({"parts": [{"label": "", "task": "prove", "template": None}]}))
    await client.post(f"/api/v1/questions/{q['id']}/figure", headers=auth)
    await drain(container)
    figure = (await client.get(f"/api/v1/questions/{q['id']}/figure", headers=auth)).json()
    assert figure["status"] == "unsupported" and "hình vẽ" in figure["detail"]


def test_the_first_view_is_the_most_spread_out_configuration() -> None:
    """User request: on first display every point is visible separately, not crowded together."""
    from app.geometry.engine import point_spread
    crowded = {"A": np.array([0.0, 0.0]), "B": np.array([4.0, 0.0]), "C": np.array([0.1, 0.05])}
    open_ = {"A": np.array([0.0, 0.0]), "B": np.array([4.0, 0.0]), "C": np.array([2.0, 3.0])}
    assert point_spread(open_) > 10 * point_spread(crowded)
    figure = spec([*TRIANGLE, {"kind": "midpoint", "id": "M", "a": "B", "b": "C"}])
    result = check_spec(figure, samples=12)
    shown = {k: np.array([v["x"], v["y"]]) for k, v in result["initial"]["values"].items() if v["type"] == "point"}
    configs, _ = sample_configs(compile_spec(figure), 12, hinted_first=True)
    assert point_spread(shown) >= max(point_spread(c.values) for c in configs) - 1e-9


def test_angles_are_unsigned_degrees() -> None:
    s = spec(TRIANGLE, targets=[{"kind": "angle", "points": ["B", "A", "C"]}])
    values = evaluate(compile_spec(s), np.array([0, 0, 1, 0, 0, 1], dtype=float))
    from app.geometry.engine import target_value
    assert target_value(s.targets[0], values) == pytest.approx(90)
    assert math.isclose(target_value(s.targets[0], evaluate(compile_spec(s), np.array([0, 0, 1, 0, -1, 0.0]))),
                        180, abs_tol=1e-9)


def test_tangency_given_is_well_conditioned() -> None:
    """Regression (live formalizer output): tangents from an external point, expressed as givens on circle points.

    A distance-based tangency residual is quadratic near tangency and left goals ~1e-5 off (inconclusive)."""
    s = spec([{**P, "id": "O"}, {**P, "id": "A"}, {"kind": "circle", "id": "c", "center": "O", "radius": 1.0},
              {"kind": "point_on_circle", "id": "B", "circle": "c"},
              {"kind": "point_on_circle", "id": "C", "circle": "c"}],
             givens=[{"kind": "tangent_line", "line": ["A", "B"], "circle": "c"},
                     {"kind": "tangent_line", "line": ["A", "C"], "circle": "c"}],
             goals=[{"kind": "concyclic", "points": ["A", "B", "O", "C"]},
                    {"kind": "perpendicular", "lines": [["O", "A"], ["B", "C"]]}])
    result = check_spec(s)
    assert [g["outcome"] for g in result["goals"]] == ["holds", "holds"]
    assert max(g["max_residual"] for g in result["goals"]) < 1e-9
