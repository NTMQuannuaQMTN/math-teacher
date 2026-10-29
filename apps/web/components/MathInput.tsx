"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import { MathText } from "@/components/MathText";
import { renderMathText } from "@/lib/math";
import { insertSnippet } from "@/lib/math-insert";
import { GROUPS, type MathSymbol } from "@/lib/math-symbols";

/** A textarea with a clickable symbol bar and a live KaTeX preview. */
export function MathInput({ label, value, onChange, rows = 5, maxLength, placeholder }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  maxLength?: number;
  placeholder?: string;
}) {
  const id = useId();
  const ref = useRef<HTMLTextAreaElement>(null);
  const pendingCaret = useRef<number | null>(null);
  const [group, setGroup] = useState(0);
  const [renderErrors, setRenderErrors] = useState<string[]>([]);

  // Restore the cursor after React re-renders the controlled textarea with the inserted snippet.
  useLayoutEffect(() => {
    if (pendingCaret.current === null || !ref.current) return;
    ref.current.focus();
    ref.current.setSelectionRange(pendingCaret.current, pendingCaret.current);
    pendingCaret.current = null;
  }, [value]);

  function insert(symbol: MathSymbol) {
    const el = ref.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const next = insertSnippet(value, start, end, symbol);
    if (maxLength && next.value.length > maxLength) return;
    pendingCaret.current = next.caret;
    onChange(next.value);
  }

  return (
    <div className="mt-4 grid gap-3 md:grid-cols-2">
      <div className="min-w-0 text-sm">
        <label htmlFor={id} className="font-medium">{label}</label>
        <div className="mt-1 rounded-lg border border-line focus-within:border-brand">
          <div role="toolbar" aria-label="Ký hiệu toán" className="border-b border-line bg-wash px-2 pt-2">
            <div className="flex flex-wrap gap-1 pb-1" role="tablist" aria-label="Nhóm ký hiệu">
              {GROUPS.map((g, i) => (
                <button key={g.name} type="button" role="tab" aria-selected={i === group} onClick={() => setGroup(i)}
                  className={`shrink-0 rounded-md px-2 py-1 text-xs font-medium ${i === group ? "bg-paper text-ink shadow-sm" : "text-muted hover:text-ink"}`}>
                  {g.name}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1 py-2">
              {(GROUPS[group]?.symbols ?? []).map((s) => (
                <button key={s.name} type="button" title={`${s.name}: ${s.before}${s.after ?? ""}`}
                  aria-label={`Chèn ${s.name}`}
                  // Keep focus (and the selection) in the textarea on desktop.
                  onMouseDown={(e) => e.preventDefault()} onClick={() => insert(s)}
                  className="min-h-9 min-w-9 rounded-md border border-line bg-paper px-2 font-serif text-base hover:bg-brand-soft">
                  {s.tex
                    // Safe: KaTeX output of a constant from this file (renderMathText escapes and runs with trust off).
                    ? <span dangerouslySetInnerHTML={{ __html: renderMathText(`$${s.tex}$`).html }} />
                    : s.label}
                </button>
              ))}
            </div>
          </div>
          <textarea id={id} ref={ref} value={value} onChange={(e) => onChange(e.target.value)} rows={rows}
            maxLength={maxLength} spellCheck={false} placeholder={placeholder}
            className="block w-full rounded-b-lg px-3 py-2 font-mono text-sm outline-none" />
        </div>
        <p className="mt-1 text-xs text-muted">Bấm ký hiệu để chèn vào chỗ con trỏ. Công thức nằm giữa hai dấu $…$.</p>
      </div>
      <div className="min-w-0 text-sm">
        <span className="font-medium">Xem trước</span>
        <div className="mt-1 min-h-24 rounded-lg border border-dashed border-line bg-wash px-3 py-2">
          {value.trim()
            ? <MathText text={value} onErrors={setRenderErrors} />
            : <p className="text-muted">Bài làm sẽ hiển thị ở đây khi em gõ.</p>}
        </div>
        {value.trim() && renderErrors.length > 0 && (
          <p className="mt-1 text-xs text-amber-700">{renderErrors[0]}</p>
        )}
      </div>
    </div>
  );
}
