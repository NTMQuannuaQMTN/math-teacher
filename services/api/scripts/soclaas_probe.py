"""Probe a SoCLaaS key: list models, test JSON output and vision, report token usage fields.

Run: SOCLAAS_API_KEY=... uv run python scripts/soclaas_probe.py [--vision-model ID] [--text-model ID]

Nothing here is billed through the app's budget ledger; each probe is one small request. Use the output to
write config/models.json (ids, vision, structured_output). Prices must come from the provider, not this script.
"""

from __future__ import annotations

import argparse
import asyncio
import base64
import json
import os
import sys
import time
from pathlib import Path

import httpx

FIXTURE = Path(__file__).resolve().parent.parent / "tests" / "fixtures" / "ocr" / "images" / "synthetic_page1.png"


async def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url",
                        default=os.environ.get("SOCLAAS_BASE_URL", "https://soclaas-api.comp.nus.edu.sg/v1"))
    parser.add_argument("--vision-model")
    parser.add_argument("--text-model")
    args = parser.parse_args()
    key = os.environ.get("SOCLAAS_API_KEY")
    if not key:
        print("Set SOCLAAS_API_KEY", file=sys.stderr)
        return 2
    async with httpx.AsyncClient(base_url=args.base_url.rstrip("/") + "/", timeout=180,
                                 headers={"Authorization": f"Bearer {key}"}) as client:
        response = await client.get("models")
        print("GET /models →", response.status_code)
        models = [m.get("id") for m in response.json().get("data", [])] if response.is_success else []
        listing = response.json() if response.is_success else response.text
        print(json.dumps(listing, indent=2, ensure_ascii=False)[:4000])
        text_model = args.text_model or (models[0] if models else "default")
        vision_model = args.vision_model or text_model

        for mode in ("json_schema", "json_object", None):
            payload: dict[str, object] = {
                "model": text_model, "max_tokens": 200, "temperature": 0,
                "messages": [{"role": "user", "content": "Trả về JSON {\"answer\": <số>} cho 2+3."}],
            }
            if mode == "json_schema":
                payload["response_format"] = {"type": "json_schema", "json_schema": {"name": "a", "schema": {
                    "type": "object", "properties": {"answer": {"type": "integer"}}, "required": ["answer"]}}}
            elif mode == "json_object":
                payload["response_format"] = {"type": "json_object"}
            started = time.monotonic()
            r = await client.post("chat/completions", json=payload)
            body = r.json() if r.headers.get("content-type", "").startswith("application/json") else r.text
            print(f"\n[{text_model}] response_format={mode} → {r.status_code} in {time.monotonic() - started:.1f}s")
            if isinstance(body, dict) and r.is_success:
                print("  content:", body["choices"][0]["message"].get("content", "")[:300])
                print("  usage:", body.get("usage"))
            else:
                print("  body:", str(body)[:500])

        image = base64.b64encode(FIXTURE.read_bytes()).decode()
        started = time.monotonic()
        r = await client.post("chat/completions", json={
            "model": vision_model, "max_tokens": 600, "temperature": 0,
            "messages": [{"role": "user", "content": [
                {"type": "text", "text": "Chép lại nguyên văn Câu 1 và Câu 2 trên ảnh, công thức viết bằng LaTeX."},
                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{image}"}}]}],
        })
        print(f"\n[{vision_model}] vision → {r.status_code} in {time.monotonic() - started:.1f}s")
        if r.is_success:
            body = r.json()
            print("  content:", body["choices"][0]["message"].get("content", "")[:800])
            print("  usage:", body.get("usage"))
        else:
            print("  body:", r.text[:500])
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
