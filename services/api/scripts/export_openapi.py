"""Write the API's OpenAPI schema to services/api/openapi.json (source for the web app's generated types).

Run: uv run python scripts/export_openapi.py
"""

from __future__ import annotations

import json
from pathlib import Path

from app.config import Settings
from app.main import create_app

OUT = Path(__file__).resolve().parent.parent / "openapi.json"


def schema() -> str:
    app = create_app(Settings(_env_file=None, environment="development"), start_worker=False)  # type: ignore[call-arg]
    return json.dumps(app.openapi(), indent=2, ensure_ascii=False, sort_keys=True) + "\n"


if __name__ == "__main__":
    OUT.write_text(schema(), encoding="utf-8")
    print("wrote", OUT)
