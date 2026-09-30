/** Prints the production solver system prompts as JSON ({ withFigure, noFigure }) — used to export fine-tuning data with the exact serving prompt. */
import { VN_GRADE_9 } from "../src/solver/curriculum";
import { buildSystemPrompt } from "../src/solver/prompts";

process.stdout.write(
  JSON.stringify({ withFigure: buildSystemPrompt(VN_GRADE_9, { withFigure: true }), noFigure: buildSystemPrompt(VN_GRADE_9, { withFigure: false }) }),
);
