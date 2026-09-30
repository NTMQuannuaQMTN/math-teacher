# Fine-tuning investigation

## Decision (2026-09-30): **not yet justified.** Improve routing and verification first (conclusions B + D).

### Evidence

1. **Data.** `tools/benchmark/export_sft.py` finds **14** usable examples (train split, verified,
   graded PASS against the verified ground truth). All 14 are difficulty 1 (basic equations,
   angles, Pythagoras). The problems where models actually fail are olympiad-level multi-part
   proofs and divisibility (Toán chuyên), and there are **zero** verified training examples of
   that kind. The verified lessons for those problems (ch-1…ch-4) are validation data and must not
   be trained on.
2. **The observed failures are not what SFT fixes.**
   - Schema slips by small models (empty ids, over-long lists) were fully fixed by grammar
     constraints plus a deterministic repair step (EXP-002 → 8/8 cached outputs valid), with no
     training.
   - Wrong mathematics on hard problems (EXP-002 ch-3; Gemini flash-lite on the same problems
     before escalation) is a reasoning-capacity problem. 14 easy examples cannot teach
     competition number theory, and "fine-tuning a bad base model won't make it a reliable
     teacher" applies.
   - Teaching style, language ("bạn") and format are already controlled by the prompt and the
     schema, and the models follow them.
3. **Cost math.** A hosted Qwen3.5-9B already costs ≈ $0.001 per problem (`cost_model.py`). A
   fine-tuned model needs either self-hosting (≈ $576/month fixed for an always-on GPU; it only
   beats hosted APIs above ~550K problems/month) or a provider that serves LoRA adapters. At this
   app's scale, fine-tuning adds cost and operational work to save fractions of a cent.

### When to revisit (all three must hold)

- ≥ 300 verified, de-duplicated lessons across all topics and difficulty 2–4, with provenance and
  none from validation/test problems. They can come from production: every verified lesson in the
  shared library that students rated well is a candidate.
- A candidate base model whose **remaining** failures, after grammar + repair + verification, are
  about format or method choice (for example using Grade-12 methods) rather than wrong mathematics.
- A held-out evaluation (the test split plus new unseen exams) to measure the gain.

## Pipeline (built, ready to run)

1. **Export:** `python3 tools/benchmark/export_sft.py tools/benchmark/results/<run>.json … --out tools/benchmark/sft/train.jsonl`
   - Chat JSONL with the exact serving system prompt (`worker/scripts/print-prompt.ts`), the problem
     as the user turn and the verified lesson JSON as the assistant turn.
   - Filters: train split only, verified, PASS, one example per problem. Provenance is kept in `meta`.
2. **Train (Apple Silicon, LoRA/QLoRA with mlx-lm)**, reproducible commands:
   ```sh
   uv venv ~/.venvs/mlx && source ~/.venvs/mlx/bin/activate && uv pip install mlx-lm
   # mlx-lm expects train.jsonl / valid.jsonl in one folder; valid = a held-out slice of TRAIN, never the benchmark validation/test split
   mlx_lm.lora --model Qwen/Qwen3-4B --train --data tools/benchmark/sft \
     --batch-size 1 --num-layers 16 --iters 300 --learning-rate 1e-5 --max-seq-length 12288 \
     --adapter-path tools/benchmark/sft/adapters/qwen3-4b-v1
   mlx_lm.fuse --model Qwen/Qwen3-4B --adapter-path tools/benchmark/sft/adapters/qwen3-4b-v1 --save-path ~/.local/models/qwen3-4b-sft-v1
   ```
   On a CUDA GPU, the same JSONL works with Unsloth/TRL `SFTTrainer` (QLoRA 4-bit, r = 16, α = 32).
3. **Evaluate:** serve the fused model with llama.cpp (convert to GGUF) and run
   `npx tsx scripts/benchmark.ts <system> --split validation`, compared with the base model on the same
   split. The test split is run only once, for the final decision.

## Synthetic data (if pursued later)

Generate candidate lessons with a strong model, then **keep only those that pass the deterministic
verifier and the ground-truth grader**, deduplicate on the canonical problem key
(`worker/src/solver/problemKey.ts`), and human-review a sample. Never generate variants of
validation or test problems.
