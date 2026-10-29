"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { MathText } from "@/components/MathText";
import { StatusBadge } from "@/components/ui";
import { type QuestionOut, TOPIC_LABELS } from "@/lib/api";

// Read-only, text-only view of a whole document for a final read-through. A confirmed question opens its
// workspace when clicked; an unconfirmed one sends the student back to the side-by-side review to fix it.
export function QuestionList({ questions, onFix }: { questions: QuestionOut[]; onFix: (id: string) => void }) {
  return (
    <ol className="space-y-3">
      {questions.map((q) => {
        const title = q.original_number || `Câu ${q.order_index}`;
        const confirmed = q.review_status === "confirmed";
        const body = (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{title}</h3>
                <StatusBadge status={q.review_status} />
              </div>
              <div className="flex flex-wrap gap-1">
                {q.topics.map((t) => (
                  <span key={t} className="rounded-full border border-line px-2.5 py-0.5 text-xs text-muted">
                    {TOPIC_LABELS[t]}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-3 space-y-2">
              {q.latex && <MathText text={q.latex} />}
              {q.subquestions.map((sub, index) => (
                <div key={`${sub.label}-${index}`} className="flex gap-2">
                  <span className="font-semibold">{sub.label}</span>
                  <MathText text={sub.latex} />
                </div>
              ))}
            </div>
            <p className={`mt-3 text-sm font-medium ${confirmed ? "text-brand" : "text-amber-700"}`}>
              {confirmed ? "Mở câu hỏi →" : "Chưa xác nhận — bấm để sửa bên phần đối chiếu"}
            </p>
          </>
        );
        return (
          <li key={q.id}>
            <ClickableCard href={confirmed ? `/questions/${q.id}` : undefined} onClick={confirmed ? undefined : () => onFix(q.id)}>
              {body}
            </ClickableCard>
          </li>
        );
      })}
    </ol>
  );
}

function ClickableCard({ children, href, onClick }: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
}) {
  const className =
    "block w-full rounded-2xl border border-line bg-paper p-4 text-left shadow-sm transition hover:border-brand " +
    "hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 sm:p-5";
  return href ? (
    <Link href={href} className={className}>{children}</Link>
  ) : (
    // Not a <button>: the card contains headings and blocks, which buttons may not.
    <div role="button" tabIndex={0} onClick={onClick} className={`${className} cursor-pointer`}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick?.();
        }
      }}>
      {children}
    </div>
  );
}
