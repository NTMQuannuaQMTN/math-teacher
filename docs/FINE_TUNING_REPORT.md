# Fine-tuning report — Toán chuyên

**No fine-tuning was performed in this sprint.** No model weights were changed. What exists is a validated
training dataset and an export to the training format; the decision and its evidence are below.

## 1. Decision

Not justified yet. Revisit when there are ≥ 200 verified chuyên training lessons and an evaluation showing
the remaining failures are about method choice or presentation rather than reasoning capacity.

## 2. Evidence

| Factor | Finding |
|---|---|
| Data | 22 verified teaching records (PTNK 2023–2025), all exported to the app's lesson format and **22/22 valid** against the production schema and structure checks (`worker/scripts/export-chuyen-sft.ts` → `tools/benchmark/sft/chuyen_train.jsonl`). Plus 14 easy v1 examples (`tools/benchmark/sft/train.jsonl`). Far too few to change reasoning; enough to overfit one school's papers. |
| Failure patterns (docs/CURRENT_SOLVER_EVALUATION.md, EXP-010, OPT-008…010) | (1) hard proofs run out of output budget or need an olympiad insight; (2) wrong arithmetic or false geometric claims, caught by the verifier; (3) language slips by the hosted model; (4) answer checks in odd formats. (1) and (2) are reasoning capacity, (3) is the hosted model's language and can't be fine-tuned (it is an API model), (4) was fixed deterministically. None is mainly "doesn't know the method", which is what SFT on 22 examples could plausibly fix. |
| Which model would be tuned | The served model is Nemotron-3-Super (hosted, free) — cannot be fine-tuned here. The local candidate, Qwen3.5-9B (Apache-2.0), could take a LoRA. |
| Hardware | Apple M5, 24 GB, on battery in Low Power Mode during this session; the GPU was busy with the evaluation (llama.cpp) the whole time. LoRA on a 9B 4-bit model needs ≈ 12–16 GB and hours for a meaningful run; a 4B model ≈ 8 GB. Toolchain: `mlx-lm` is **not installed** on this machine (the earlier plan in FINE_TUNING.md was never executed). |
| Deployment | A LoRA-tuned Qwen would need a host that serves adapters (or merged weights) — not available within a $0 budget; the free hosted model can't load adapters. |
| Cost/benefit | Retrieval (method cards) and verification changes cost nothing at inference and are reversible; fine-tuning is neither. |

## 3. What was built so it can be run later

- **Data**: `data/training/teaching.jsonl` (22, verified, structured, Vietnamese, teacher-review pending) and
  its SFT rendering `tools/benchmark/sft/chuyen_train.jsonl` (system prompt + user message + lesson JSON,
  exactly as served).
- **Split discipline**: exam-level; validation = PTNK 2026 + TP.HCM 2025, test = Hà Nội + KHTN (never in
  training).
- **Recipe when justified** (not executed):
  ```bash
  pip install mlx-lm
  mlx_lm.lora --model Qwen/Qwen3.5-9B-Instruct --train --data tools/benchmark/sft \
     --iters 300 --batch-size 1 --lora-layers 16 --learning-rate 1e-5 --mask-prompt
  # evaluate: llama.cpp with the adapter merged, then
  npx tsx worker/scripts/benchmark.ts qwen3.5-9b --dataset chuyen --split validation --exp FT-001
  ```
  Overfitting check: validation answer accuracy and grade-level rubric before vs after; any drop in
  validation PASS with a rise in train PASS = memorisation.

## 4. What would change the decision

1. ≥ 200 verified lessons across ≥ 3 schools (TRAINING_DATASET.md has the plan).
2. Evaluation showing the base model has the reasoning but chooses wrong methods or explains badly even
   with method cards.
3. An inference host that serves the tuned model within budget.
