"use client";

import { useEffect, useMemo } from "react";
import { renderMathText } from "@/lib/math";

export function MathText({
  text,
  className = "",
  onErrors,
}: {
  text: string;
  className?: string;
  onErrors?: (errors: string[]) => void;
}) {
  const rendered = useMemo(() => renderMathText(text), [text]);
  const errorKey = rendered.errors.join("\n");
  useEffect(() => {
    onErrors?.(rendered.errors);
  }, [errorKey]);
  return (
    <div
      className={`math-text leading-relaxed ${className}`}
      // Safe: renderMathText escapes all text and KaTeX runs with trust disabled.
      dangerouslySetInnerHTML={{ __html: rendered.html }}
    />
  );
}
