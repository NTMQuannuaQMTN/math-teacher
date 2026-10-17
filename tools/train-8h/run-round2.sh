#!/bin/zsh
# Second 8-hour run (2026-10-15): every reviewed question + fresh unseen ones, one specialty at a time.
cd "$(dirname $0)/../../worker"
for spec in "algebra 4" "combinatorics 3" "number_theory 3" "geometry 4"; do
  set -- ${=spec}
  npx tsx scripts/train-8h.ts $1 $2 all > ../tools/train-8h/results/$1-r$2-all.log 2>&1
done
echo done > ../tools/train-8h/results/round2.done
