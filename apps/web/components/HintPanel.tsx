"use client";

import { MathText } from "@/components/MathText";
import { VerdictBadges } from "@/components/SolutionView";
import { Button, Card } from "@/components/ui";
import type { SolutionOut } from "@/lib/api";

const LEVEL_LABELS: Record<SolutionOut["hints"][number]["level"], string> = {
  concept: "Kiến thức cần dùng",
  observation: "Điều cần nhận ra",
  strategy: "Hướng giải",
  key_step: "Bước then chốt",
};

/** Hints first, one at a time; the full solution is a separate, deliberate step. */
export function HintPanel({
  solution,
  busy,
  onNextHint,
  onReveal,
}: {
  solution: SolutionOut;
  busy: boolean;
  onNextHint: () => void;
  onReveal: () => void;
}) {
  const opened = solution.hints.length;
  const remaining = solution.hints_total - opened;
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Gợi ý</h2>
        <VerdictBadges solution={solution} />
      </div>
      {solution.hints_total > 0 ? (
        <p className="mt-1 text-sm text-muted">
          Hãy thử tự giải sau mỗi gợi ý. Có {solution.hints_total} gợi ý, mỗi gợi ý cụ thể hơn gợi ý trước.
        </p>
      ) : (
        <p className="mt-1 text-sm text-muted">Bài này chưa có gợi ý; em có thể xem lời giải đầy đủ.</p>
      )}

      {opened > 0 && (
        <ol className="mt-4 space-y-3" aria-label="Các gợi ý đã mở">
          {solution.hints.map((hint, index) => (
            <li key={index} className="rounded-xl border border-line bg-brand-soft/50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand">
                Gợi ý {index + 1} · {LEVEL_LABELS[hint.level]}
              </p>
              <MathText text={hint.text_vi} className="mt-1" />
            </li>
          ))}
        </ol>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {remaining > 0 && (
          <Button onClick={onNextHint} disabled={busy}>
            {opened === 0 ? "Xem gợi ý đầu tiên" : `Xem gợi ý tiếp theo (${opened + 1}/${solution.hints_total})`}
          </Button>
        )}
        <Button variant={remaining > 0 ? "secondary" : "primary"} onClick={onReveal}
          disabled={busy || !solution.can_reveal_solution}>
          Xem lời giải đầy đủ
        </Button>
      </div>
      {!solution.can_reveal_solution && solution.reveal_locked_reason && (
        <p className="mt-2 text-sm text-muted">{solution.reveal_locked_reason}</p>
      )}
    </Card>
  );
}
