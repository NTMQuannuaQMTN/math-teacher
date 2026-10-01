#!/bin/sh
# OCR speed/accuracy matrix on local models (no API cost). Each configuration gets its own
# llama-server on port 8090 (the app's server on 8080 is left alone), runs the 17 single-problem
# fixtures and the 3 real exam pages through worker/scripts/ocr-speed.ts, and is marked INVALID if
# the Mac slept while it ran (sleep makes timings meaningless).
#
#   sh tools/benchmark/run-ocr-matrix.sh [config …]      (default: all)
# Needs: plugged in, lid open (macOS sleeps on lid-close on battery), Low Power Mode off.
set -u
REPO=$(cd "$(dirname "$0")/../.." && pwd)
LLAMA=${LLAMA:-$HOME/.local/llama.cpp/llama-b11272/llama-server}
M=$HOME/.local/models
PORT=8090
LOG=$REPO/tools/benchmark/results/ocr-matrix.log
SINGLE=$(python3 -c "import json; print(','.join(c['id'] for c in json.load(open('$REPO/tools/ocr-eval/cases.json')) if not c['id'][:2] in ('18','19','20')))")
EXAM=18-exam-kc-p1,19-exam-kc-p2,20-exam-chuyen

# name | model | mmproj | format | text prompt
CONFIGS='
q35-9b-full|Qwen3.5-9B-Q4_K_M.gguf|qwen3.5-9b-mmproj-F16.gguf|full|
q35-9b-compact|Qwen3.5-9B-Q4_K_M.gguf|qwen3.5-9b-mmproj-F16.gguf|compact|
q35-4b-compact|ocr/qwen3.5-4b-q4_k_m.gguf|ocr/qwen3.5-4b-mmproj-f16.gguf|compact|
q35-2b-compact|ocr/qwen3.5-2b-q4_k_m.gguf|ocr/qwen3.5-2b-mmproj-f16.gguf|compact|
paddleocr-vl-text|ocr/paddleocr-vl-1.6.gguf|ocr/paddleocr-vl-1.6-mmproj.gguf|text|OCR:
glm-ocr-text|ocr/glm-ocr-q8_0.gguf|ocr/glm-ocr-mmproj-q8_0.gguf|text|Text Recognition:
'
WANT="$*"
sleeps() { pmset -g log 2>/dev/null | grep -c " Sleep  " ; }

echo "$CONFIGS" | while IFS='|' read -r name model mmproj format prompt; do
  [ -z "$name" ] && continue
  if [ -n "$WANT" ] && ! echo " $WANT " | grep -q " $name "; then continue; fi
  echo "=== $name ($(date '+%H:%M:%S'); $(pmset -g batt | tail -1 | cut -c1-60))" | tee -a "$LOG"
  SERVER=""
  if [ "$model" = "Qwen3.5-9B-Q4_K_M.gguf" ] && curl -s -m 2 localhost:8080/health | grep -q ok; then
    # Same model as the app's server on 8080: reuse it (a second 9B copy would not fit in 18 GB of Metal memory).
    URL=http://127.0.0.1:8080
  else
    lsof -ti:$PORT | xargs kill 2>/dev/null; sleep 2
    "$LLAMA" -m "$M/$model" --mmproj "$M/$mmproj" --alias "$name" -c 16384 -np 1 -ngl 99 --jinja --port $PORT \
      > "$REPO/tools/benchmark/results/llama-$name.log" 2>&1 &
    SERVER=$!
    URL=http://127.0.0.1:$PORT
    for i in $(seq 1 120); do curl -s -m 2 localhost:$PORT/health | grep -q ok && break; sleep 2; done
  fi
  before=$(sleeps)
  (cd "$REPO/worker" && npx tsx scripts/ocr-speed.ts --tag "$name" --format "$format" --prompt "$prompt" \
      --model "$name" --url "$URL" --ids "$SINGLE" 2>&1 | tail -1) | tee -a "$LOG"
  (cd "$REPO/worker" && npx tsx scripts/ocr-speed.ts --tag "$name-exam" --format "$format" --prompt "$prompt" \
      --model "$name" --url "$URL" --ids "$EXAM" --max-tokens 6000 2>&1 | tail -4) | tee -a "$LOG"
  after=$(sleeps)
  [ "$after" -gt "$before" ] && echo "INVALID: the Mac slept during $name — rerun it" | tee -a "$LOG"
  [ -n "$SERVER" ] && { kill $SERVER 2>/dev/null; wait $SERVER 2>/dev/null; }
done
echo "MATRIX_DONE $(date '+%H:%M:%S')" | tee -a "$LOG"
