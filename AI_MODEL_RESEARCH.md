# AI model research

Shared research state for the cost/accuracy sprint. **Claude** writes the sections marked (Claude);
**Grok** adds independent research and challenges in the sections marked (Grok). Neither agent
overwrites the other's conclusions without evidence: record the disagreement, define an experiment,
and link its EXPERIMENT_LOG entry.

## Constraints (from the user, 2026-09-30)

- Gemini is **disabled**, and no paid API may be called. Every experiment is local or offline, so
  Gemini results come only from lessons stored by earlier runs.
- Machine: Apple M5, 24 GB unified memory (18 GB usable by Metal), llama.cpp b11272 (official build).
  During the sprint it ran on battery with **Low Power Mode on**: generation was measured at
  19.5 tok/s for a 4B Q4 model (llama-bench tg64), which is several times below what plugged-in
  M-series machines usually reach. Local latency figures here are therefore worst-case.

## Candidate matrix (Claude) — facts from Hugging Face / OpenRouter APIs, fetched 2026-09-30

| Model | Params (active) | Released | License / gated | Vision | Hosted price (OpenRouter, $/M in · out) | Local on this Mac | Notes |
|---|---|---|---|---|---|---|---|
| Qwen3-4B (Q4_K_M, official GGUF) | 4B | 2025-04 | Apache-2.0 / open | no | — | ✅ measured | thinking on/off switch |
| Qwen3-8B (Q4_K_M, official GGUF) | 8B | 2025-04 | Apache-2.0 / open | no | 0.117 · 0.455 | ✅ | |
| Qwen3-14B | 14B | 2025-04 | Apache-2.0 / open | no | 0.12 · 0.24 | ⚠ ~6 tok/s here | download cancelled (too slow in Low Power Mode) |
| **Qwen3.5-4B / 9B** (Unsloth GGUF) | 4B / 9B | 2026-02 | Apache-2.0 / open | **yes** | 9B: **0.10 · 0.15** | ✅ 9B | newest small Qwen; multimodal (OCR candidate) |
| Qwen3.6-35B-A3B (MoE) | 35B (3B) | 2026-04 | Apache-2.0 / open | yes | 0.15 · 1.00 | ❌ Q4 ≈ 20 GB > 18 GB Metal limit | fast per token when served |
| **Gemma-4-12B-it** (Unsloth GGUF) | 12B | 2026-05 | **Apache-2.0** / open | yes | — | ✅ | Google; strong multilingual |
| Gemma-4-26B-A4B-it (MoE) | 26B (4B) | 2026-03 | Apache-2.0 / open | yes | 0.09 · 0.30 (and `:free`) | ⚠ Q4 ≈ 15 GB, tight | |
| DeepSeek-V4-Flash | large MoE | 2026-04/07 | MIT | (vision exp.) | 0.14 · 0.28 | ❌ too large | hosted only for us |
| Qwen2.5-Math-7B-Instruct | 7B | 2024-09 | Apache-2.0 | no | — | possible | math-specialised but **English-only** card; old |
| DeepSeek-R1-Distill-Qwen-7B/14B | 7B/14B | 2025-01 | MIT | no | — | possible | long reasoning, poor at strict JSON |
| Vietnamese-specific: Vistral-7B-Chat, Arcee-VyLinh (3B), SeaLLMs-v3-7B | 3–7B | 2024 | AFL-3.0 (gated) / Apache-2.0 / other | no | — | possible | low adoption (<1.2K downloads); older base models |
| Gemini 3.5 flash-lite (baseline) | — | — | proprietary | yes | 0.30 · 2.50 | API only | current first attempt |
| Gemini 3.5 flash (baseline fallback) | — | — | proprietary | yes | 1.50 · 9.00 | API only | current retry model |
| Gemini 3.1 flash-lite (OCR) | — | — | proprietary | yes | 0.25 · 1.50 | API only | current OCR |

Selection for local benchmarking (in order of expected value, given ~6 h and a throttled GPU):
1. **Qwen3-4B**: the smallest credible model. It tells us whether a cheap model plus the verifier is
   enough for easy items.
2. **Qwen3.5-9B**: the newest small Qwen, multimodal, and the cheapest hosted price in the table.
3. **Gemma-4-12B**: a different model family (which helps avoid one family's biases), Apache-2.0,
   multimodal.
4. Qwen3-8B as a control for 3.5 vs 3.

Not selected: Vietnamese-specific 7B models (older base models, low adoption, gated or unclear
licences), math-only English models (the lessons must be in Vietnamese), R1-distills (reasoning
traces without reliable structured output), and anything above ~15 GB at Q4 (does not fit Metal here).

## Notes on methodology (Claude)

- The same prompt (`PROMPT_VERSION` solver-v1.7), the same strict JSON schema, the same verifier and
  the same deterministic grader are used for every model. Local models are constrained to the schema
  with llama.cpp's JSON-schema grammar, the equivalent of Gemini/OpenAI structured output.
- Local runs use 4-bit quantisation (Q4_K_M). Hosted providers usually serve BF16/FP8, so hosted
  accuracy is expected to be **equal or better** than these local measurements. It is not measured
  here.
- The test split (Toán KC 2026) is untouched until final comparisons; see DATASET.md.

## Independent research and challenges (Grok)

_(Grok: add missing candidates, benchmark references and challenges here.)_
