"""
Cost per 1 / 10 / 100 / 1,000 / 10,000 solved problems for each deployment option.

Every input is labelled MEASURED (this repo's logs/benchmarks, or a price list fetched on 2026-09-30)
or ASSUMED (could not be measured here; change it and re-run). Run: python3 tools/benchmark/cost_model.py
"""

# --- MEASURED: API list prices, USD per 1M tokens (OpenRouter /api/v1/models, 2026-09-30; Gemini matches Google's list)
PRICES = {
    "gemini-3.5-flash-lite": (0.30, 2.50),
    "gemini-3.5-flash": (1.50, 9.00),
    "qwen3.5-9b (hosted)": (0.10, 0.15),
    "gemma-4-26b-a4b (hosted)": (0.09, 0.30),
    "deepseek-v4-flash (hosted)": (0.14, 0.28),
}

# --- MEASURED: tokens per solved problem, by difficulty tier (whole pipeline incl. retries)
# easy: flash-lite single attempt (solve logs: in 2,063 / out 1,222); standard: geometry prompt, ~1.5 attempts
# (eval runs: ~6K in / ~3.5K out incl. thinking); hard: Toán chuyên Câu 4 on gemini-3.5-flash = $0.316 measured.
TIERS = {"easy": (2_100, 1_250), "standard": (6_000, 3_500), "hard": (14_000, 33_000)}
# Mix of tiers in real use — ASSUMED from the held-out exam's composition (Toán KC: 13/15 difficulty ≤ 2,
# 1 hard proof), i.e. 60% easy, 33% standard, 7% hard.
MIX = {"easy": 0.60, "standard": 0.33, "hard": 0.07}
OCR_PER_PHOTO = 0.0008  # MEASURED (gemini-3.1-flash-lite, one photo)


def api_cost(model_by_tier, fallback_rate=0.0, fallback_model=None):
    """Expected $ per problem; optional fallback (a second, stronger call) on a fraction of problems."""
    total = 0.0
    for tier, share in MIX.items():
        tin, tout = TIERS[tier]
        pin, pout = PRICES[model_by_tier[tier]]
        cost = (tin * pin + tout * pout) / 1e6
        if fallback_model:
            fin, fout = PRICES[fallback_model]
            cost += fallback_rate * (tin * fin + tout * fout) / 1e6
        total += share * cost
    return total


# --- ASSUMED: self-hosted GPU (not measurable without buying GPU time)
GPU_HOURLY = 0.80  # e.g. one 24 GB L4-class cloud GPU, on-demand
GPU_OUTPUT_TOKS_PER_S = 1_200  # aggregate with continuous batching (vLLM/SGLang) for a ~9B model in FP8
LESSON_OUTPUT_TOKENS = sum(MIX[t] * TIERS[t][1] for t in MIX)

rows = []
rows.append(("Current: flash-lite → flash (hard tier on flash)", api_cost({"easy": "gemini-3.5-flash-lite", "standard": "gemini-3.5-flash-lite", "hard": "gemini-3.5-flash"}, 0.25, "gemini-3.5-flash")))
rows.append(("Gemini flash-lite only (no escalation)", api_cost({t: "gemini-3.5-flash-lite" for t in TIERS})))
rows.append(("Hosted Qwen3.5-9B only", api_cost({t: "qwen3.5-9b (hosted)" for t in TIERS})))
rows.append(("Hosted Qwen3.5-9B → Gemini flash on verify failure (30%)", api_cost({t: "qwen3.5-9b (hosted)" for t in TIERS}, 0.30, "gemini-3.5-flash")))
rows.append(("Hosted Gemma-4-26B-A4B only", api_cost({t: "gemma-4-26b-a4b (hosted)" for t in TIERS})))
rows.append(("Hosted DeepSeek-V4-Flash only", api_cost({t: "deepseek-v4-flash (hosted)" for t in TIERS})))

print(f"Expected output tokens per problem (mix): {LESSON_OUTPUT_TOKENS:,.0f}\n")
print(f"{'Option':62s} {'per problem':>12s} {'x10':>8s} {'x100':>8s} {'x1,000':>9s} {'x10,000':>9s}")
for name, c in rows:
    print(f"{name:62s} ${c:11.5f} {c*10:8.3f} {c*100:8.2f} {c*1000:9.2f} {c*10000:9.2f}")

# Self-hosted: fixed cost per month regardless of traffic, plus capacity.
per_problem_at_full_load = GPU_HOURLY / 3600 / (GPU_OUTPUT_TOKS_PER_S / LESSON_OUTPUT_TOKENS)
monthly_fixed = GPU_HOURLY * 24 * 30
capacity_per_month = GPU_OUTPUT_TOKS_PER_S / LESSON_OUTPUT_TOKENS * 3600 * 24 * 30
print(f"\nSelf-hosted GPU (ASSUMED ${GPU_HOURLY}/h, {GPU_OUTPUT_TOKS_PER_S} output tok/s aggregate):")
print(f"  fixed ${monthly_fixed:,.0f}/month if always on; capacity ≈ {capacity_per_month:,.0f} problems/month")
print(f"  ${per_problem_at_full_load:.5f}/problem only at 100% utilisation")
for monthly in (1_000, 10_000, 100_000, 1_000_000):
    print(f"  at {monthly:>9,} problems/month: ${monthly_fixed / monthly:.4f}/problem (always-on GPU)")
cheapest_api = min(c for _, c in rows)
print(f"  break-even vs the cheapest hosted API (${cheapest_api:.5f}/problem): {monthly_fixed / cheapest_api:,.0f} problems/month")
print(f"\nOCR adds ${OCR_PER_PHOTO}/photo (MEASURED); the shared lesson library makes repeat problems $0.")
