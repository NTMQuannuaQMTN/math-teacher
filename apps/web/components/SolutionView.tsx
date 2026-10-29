"use client";

import { MathText } from "@/components/MathText";
import { Card } from "@/components/ui";
import {
  CURRICULUM_LABELS,
  type CurriculumStatus,
  type SolutionOut,
  VERIFICATION_LABELS,
  type VerificationStatus,
} from "@/lib/api";

const VERIFICATION_STYLES: Record<VerificationStatus, string> = {
  VERIFIED: "border-emerald-300 bg-emerald-50 text-emerald-900",
  PARTIALLY_VERIFIED: "border-sky-300 bg-sky-50 text-sky-900",
  UNVERIFIED: "border-amber-300 bg-amber-50 text-amber-900",
  INCORRECT: "border-red-300 bg-red-50 text-red-900",
  UNSOLVED: "border-slate-300 bg-slate-50 text-slate-800",
};
const CURRICULUM_STYLES: Record<CurriculumStatus, string> = {
  COMPLIANT: "border-emerald-300 bg-emerald-50 text-emerald-900",
  COMPLIANT_WITH_WARNINGS: "border-amber-300 bg-amber-50 text-amber-900",
  NON_COMPLIANT: "border-red-300 bg-red-50 text-red-900",
  NOT_CHECKED: "border-slate-300 bg-slate-50 text-slate-800",
};
const STRENGTH_LABELS: Record<SolutionOut["evidence"][number]["strength"], string> = {
  exact: "chính xác",
  exhaustive: "xét hết mọi trường hợp",
  bounded: "tìm kiếm trong phạm vi giới hạn",
  sampled: "kiểm tra trên điểm ngẫu nhiên",
  none: "không kết luận",
};

export function VerdictBadges({ solution }: { solution: SolutionOut }) {
  const v = solution.verification_status;
  const c = solution.curriculum_status;
  return (
    <div className="flex flex-wrap gap-2" aria-label="Trạng thái lời giải">
      {v && (
        <span title={VERIFICATION_LABELS[v].help}
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${VERIFICATION_STYLES[v]}`}>
          {VERIFICATION_LABELS[v].label}
        </span>
      )}
      {c && (
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${CURRICULUM_STYLES[c]}`}>
          {CURRICULUM_LABELS[c]}
        </span>
      )}
    </div>
  );
}

export function SolutionView({ solution }: { solution: SolutionOut }) {
  const v = solution.verification_status;
  const warnUnverified = v === "UNVERIFIED" || v === "INCORRECT" || v === "UNSOLVED";
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Lời giải</h2>
          <VerdictBadges solution={solution} />
        </div>
        {v && <p className="mt-2 text-sm text-muted">{VERIFICATION_LABELS[v].help}</p>}
        {warnUnverified && (
          <p role="alert" className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {v === "INCORRECT"
              ? "Lời giải dưới đây có thể sai. Đừng chép lại khi chưa tự kiểm tra từng bước."
              : v === "UNSOLVED"
                ? "Hệ thống chưa giải được bài này một cách đáng tin cậy."
                : "Lời giải chưa được công cụ kiểm chứng. Hãy đọc với tinh thần phản biện."}
          </p>
        )}
        {solution.stale && (
          <p className="mt-3 rounded-lg bg-wash px-3 py-2 text-sm">
            Đề bài đã được sửa sau khi giải. Bấm “Giải lại” để có lời giải mới.
          </p>
        )}
        {solution.solved === false && solution.unsolved_reason_vi && (
          <p className="mt-3 text-sm">{solution.unsolved_reason_vi}</p>
        )}
        {solution.approach_vi && (
          <div className="mt-4 rounded-xl bg-brand-soft px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">Ý tưởng chính</p>
            <MathText text={solution.approach_vi} className="mt-1" />
          </div>
        )}
      </Card>

      {solution.parts.map((part, index) => (
        <Card key={`${part.label}-${index}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold">{part.label ? `Ý ${part.label}` : "Bài giải"}</h3>
            {part.verdict && solution.parts.length > 1 && (
              <span title={part.verdict.reason_vi}
                className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${VERIFICATION_STYLES[part.verdict.status]}`}>
                {VERIFICATION_LABELS[part.verdict.status].label}
              </span>
            )}
          </div>
          <ol className="mt-3 space-y-3">
            {part.steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span aria-hidden className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-wash text-xs font-semibold text-muted">
                  {i + 1}
                </span>
                <MathText text={step} className="min-w-0 flex-1" />
              </li>
            ))}
          </ol>
          <div className="mt-4 rounded-xl border border-line bg-wash px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Kết luận</p>
            <MathText text={part.final_answer_latex} className="mt-1 font-medium" />
          </div>
        </Card>
      ))}

      {(solution.evidence.length > 0 || solution.curriculum_findings.length > 0) && (
        <Card>
          <details>
            <summary className="cursor-pointer font-semibold">Bằng chứng kiểm chứng</summary>
            <ul className="mt-3 space-y-2 text-sm">
              {solution.evidence.map((e, i) => (
                <li key={i} className="rounded-lg border border-line px-3 py-2">
                  <span className="font-medium">{e.outcome === "confirmed" ? "✓" : e.outcome === "refuted" ? "✗" : "?"}</span>{" "}
                  {e.part && <span className="text-muted">Ý {e.part}: </span>}
                  {e.detail} <span className="text-muted">({STRENGTH_LABELS[e.strength]})</span>
                </li>
              ))}
              {solution.curriculum_findings.map((f, i) => (
                <li key={`c${i}`} className={`rounded-lg border px-3 py-2 ${f.severity === "prohibited" ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}`}>
                  {f.message}
                  {f.excerpt && <span className="mt-1 block font-mono text-xs text-muted">{f.excerpt}</span>}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted">
              Chính sách chương trình: {solution.policy_version} · {solution.attempts} lần giải
              {solution.from_cache ? " · lấy từ bộ nhớ đệm" : ""}
            </p>
          </details>
        </Card>
      )}
    </div>
  );
}
