"""Write Python-engine results that the browser engine must reproduce (apps/web/lib/geometry/fixtures.json).

Run: uv run python scripts/export_geometry_fixtures.py
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np

from app.geometry.dsl import GeometrySpec
from app.geometry.engine import _serialize, compile_spec, evaluate, residuals, sample_configs

OUT = Path(__file__).resolve().parents[3] / "apps" / "web" / "lib" / "geometry" / "fixtures.json"
P = {"kind": "free_point"}
TRI = [{**P, "id": "A"}, {**P, "id": "B"}, {**P, "id": "C"}]

SPECS = [
    {"objects": [*TRI, {"kind": "circumcenter", "id": "O", "points": ["A", "B", "C"]},
                 {"kind": "orthocenter", "id": "H", "points": ["A", "B", "C"]},
                 {"kind": "centroid", "id": "G", "points": ["A", "B", "C"]},
                 {"kind": "incenter", "id": "I", "points": ["A", "B", "C"]},
                 {"kind": "midpoint", "id": "M", "a": "B", "b": "C"},
                 {"kind": "reflection", "id": "R", "point": "A", "center": "M"},
                 {"kind": "line", "id": "BC", "through": ["B", "C"]},
                 {"kind": "projection", "id": "D", "point": "A", "line": "BC"},
                 {"kind": "angle_bisector", "id": "da", "vertex": "A", "a": "B", "b": "C"},
                 {"kind": "intersection", "id": "E", "of": ["da", "BC"]},
                 {"kind": "parallel", "id": "pa", "through": "A", "to": "BC"},
                 {"kind": "perpendicular", "id": "pp", "through": "M", "to": "BC"}],
     "goals": [{"kind": "collinear", "points": ["O", "G", "H"]},
               {"kind": "perpendicular", "lines": [["A", "D"], ["B", "C"]]},
               {"kind": "equal_angle", "angles": [["B", "A", "E"], ["E", "A", "C"]]}]},
    {"objects": [{**P, "id": "O"}, {**P, "id": "A"}, {"kind": "circle", "id": "w", "center": "O", "radius": 2},
                 {"kind": "circle_diameter", "id": "k", "a": "O", "b": "A"},
                 {"kind": "intersection", "id": "B", "of": ["w", "k"]},
                 {"kind": "intersection", "id": "C", "of": ["w", "k"], "exclude": "B"},
                 {"kind": "tangent", "id": "t", "circle": "w", "at": "B"},
                 {"kind": "line", "id": "OA", "through": ["O", "A"]},
                 {"kind": "intersection", "id": "X", "of": ["OA", "w"], "near": "A"},
                 {"kind": "point_on_circle", "id": "P", "circle": "w"},
                 {"kind": "segment", "id": "s", "through": ["O", "A"]},
                 {"kind": "point_on_line", "id": "Q", "line": "s"},
                 {"kind": "circumcircle", "id": "cc", "points": ["A", "B", "C"]}],
     "givens": [{"kind": "length_value", "segment": ["O", "A"], "value": 5}],
     "goals": [{"kind": "perpendicular", "lines": [["O", "A"], ["B", "C"]]},
               {"kind": "on_line", "point": "A", "line": "t"},
               {"kind": "concyclic", "points": ["A", "B", "O", "C"]},
               {"kind": "on_circle", "point": "P", "circle": "w"},
               {"kind": "tangent_line", "line": ["A", "B"], "circle": "w"}]},
    {"objects": TRI,
     "givens": [{"kind": "equal_length", "segments": [["A", "B"], ["A", "C"]]},
                {"kind": "angle_value", "angle": ["B", "A", "C"], "degrees": 40},
                {"kind": "length_ratio", "segments": [["A", "B"], ["A", "B"]], "ratio": 1}],
     "goals": [{"kind": "equal_angle", "angles": [["A", "B", "C"], ["A", "C", "B"]]}]},
]


def main() -> None:
    fixtures = []
    for raw in SPECS:
        spec = GeometrySpec.model_validate(raw)
        compiled = compile_spec(spec)
        configs, _ = sample_configs(compiled, 3, seed=5)
        for config in configs:
            values = evaluate(compiled, config.params)
            fixtures.append({
                "spec": raw, "params": [float(p) for p in config.params],
                "values": _serialize(values),
                "goal_residuals": [residuals(g, values) for g in spec.goals],
                "given_residuals": [residuals(g, values) for g in spec.givens],
            })
    OUT.write_text(json.dumps(fixtures, indent=1) + "\n", encoding="utf-8")
    print(f"wrote {len(fixtures)} fixtures to {OUT}")


if __name__ == "__main__":
    np.set_printoptions(precision=12)
    main()
