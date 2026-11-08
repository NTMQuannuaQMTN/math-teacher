"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { MathText } from "@/components/MathText";
import { Button, FlagList, StatusBadge } from "@/components/ui";
import { type QuestionOut, TOPIC_LABELS } from "@/lib/api";

// Read-only, text-only view of a whole document (screen 2). A confirmed question opens its workspace when clicked;
// "Sửa" (or clicking an unconfirmed question) opens that one question next to the page image to fix it.
export function QuestionList({ questions, onEdit }: { questions: QuestionOut[]; onEdit: (id: string) => void }) {
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
          </>
        );
        return (
          <li key={q.id} id={`item-${q.id}`}
            className="rounded-2xl border border-line bg-paper shadow-sm transition hover:border-brand hover:shadow-md">
            <ClickableArea href={confirmed ? `/questions/${q.id}` : undefined} onClick={confirmed ? undefined : () => onEdit(q.id)}>
              {body}
            </ClickableArea>
            {!confirmed && q.flags.length > 0 && <div className="px-4 sm:px-5"><FlagList flags={q.flags} /></div>}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 pb-4 sm:px-5 sm:pb-5">
              {confirmed ? (
                <Link href={`/questions/${q.id}`} className="text-sm font-medium text-brand hover:underline">Mở câu hỏi →</Link>
              ) : (
                <span className="text-sm font-medium text-amber-700">Chưa xác nhận — bấm “Sửa” để đối chiếu với ảnh</span>
              )}
              <Button variant="secondary" onClick={() => onEdit(q.id)} aria-label={`Sửa ${title}`}>Sửa</Button>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function ClickableArea({ children, href, onClick }: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
}) {
  const className =
    "block w-full rounded-2xl p-4 pb-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 sm:p-5 sm:pb-3";
  return href ? (
    <Link href={href} className={className}>{children}</Link>
  ) : (
    // Not a <button>: the area contains headings and blocks, which buttons may not.
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
