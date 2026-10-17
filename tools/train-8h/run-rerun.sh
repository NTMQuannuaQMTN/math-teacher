#!/bin/zsh
# Re-run (2026-10-15 15:45) of the items that failed or were wrong in round 2, after fixes 38-44.
cd "$(dirname $0)/../../worker"
npx tsx scripts/train-8h.ts algebra 4b all hcm-2025-chuyen/1b,hcm-2025-chuyen/2a,ptnk-2026-chuyen/1,alg8-h4,alg8-h8,alg9-f3,alg9-f4,khtn-2025-vong2/I.2,alg8-h3,ptnk-2023-chuyen/1 > ../tools/train-8h/results/algebra-r4b-all.log 2>&1
npx tsx scripts/train-8h.ts combinatorics 3b all comb8-h2,comb8-h4,comb9-f2,ptnk-2023-chuyen/3b,ptnk-2024-chuyen/5b > ../tools/train-8h/results/combinatorics-r3b-all.log 2>&1
npx tsx scripts/train-8h.ts number_theory 3b all nt9-f3,nt9-f4,hanoi-2025-chuyen/II.1,nt8-h7 > ../tools/train-8h/results/number_theory-r3b-all.log 2>&1
npx tsx scripts/train-8h.ts geometry 4b all ptnk-2026-chuyen/2,hanoi-2025-chuyen/IV.1,hcm-2025-chuyen/3a > ../tools/train-8h/results/geometry-r4b-all.log 2>&1
echo done > ../tools/train-8h/results/rerun.done
