# Overall evaluation

## Actual measurements

| Measure | Result |
|---|---:|
| Existing Worker test files | 22 |
| Existing Worker tests before specialist profiles | 414 passed |
| Model-generated questions newly run | 0 |
| Fresh accuracy measurement | Not available |
| Human satisfaction | Not measured |
| Solve wall-clock contract | hard application cap: 30,000 ms |
| p50/p95/max latency | Not measured in this checkpoint |

The profile integration is implemented, but it would be dishonest to claim 90% satisfaction or improved model accuracy without fresh generated outputs and held-out scoring. The four-hour schedule cannot be simulated by writing reports.

## Acceptance rubric

For future actual runs, score each question: mathematical correctness 40, completeness 20, Grade 9 clarity 15, method 10, LaTeX/rendering 10, uncertainty/verification 5. A material mathematical error fails the question regardless of presentation.

## Next checkpoint

Run a fixed sample from each specialist across development, validation, and held-out splits; record actual answers, verification status, latency, and failures. Then use only development/validation failures to improve the profiles before a fresh held-out run.
