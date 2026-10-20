"""The committed OpenAPI schema (used to generate the web app's TypeScript types) must be current."""

from scripts.export_openapi import OUT, schema


def test_openapi_snapshot_is_current() -> None:
    assert OUT.read_text(encoding="utf-8") == schema(), (
        "API contract changed: run `uv run python scripts/export_openapi.py` and `npm run gen:api` in apps/web")
