// Splits question text into text and math segments (same delimiters as the API normaliser) and
// renders math with KaTeX. `\unclear{...}` marks notation OCR could not read with certainty.
import katex from "katex";

export type Segment =
  | { kind: "text"; content: string }
  | { kind: "math"; content: string; display: boolean }
  | { kind: "raw"; content: string };

export const KATEX_MACROS: Record<string, string> = {
  // "##" escapes "#" inside a KaTeX macro body.
  "\\unclear": "\\colorbox{##fde68a}{$#1$}",
};

export function splitSegments(text: string): Segment[] {
  const segments: Segment[] = [];
  let buffer = "";
  let i = 0;
  const flush = () => {
    if (buffer) segments.push({ kind: "text", content: buffer });
    buffer = "";
  };
  while (i < text.length) {
    if (text[i] === "\\" && (text[i + 1] === "$" || text[i + 1] === "%")) {
      buffer += text[i + 1];
      i += 2;
      continue;
    }
    let open: [string, string, boolean] | null = null;
    if (text.startsWith("$$", i)) open = ["$$", "$$", true];
    else if (text[i] === "$") open = ["$", "$", false];
    else if (text.startsWith("\\(", i)) open = ["\\(", "\\)", false];
    else if (text.startsWith("\\[", i)) open = ["\\[", "\\]", true];
    if (!open) {
      buffer += text[i];
      i += 1;
      continue;
    }
    const [start, end, display] = open;
    let j = i + start.length;
    let close = -1;
    while (j < text.length) {
      if (text[j] === "\\" && text[j + 1] === "$") {
        j += 2;
        continue;
      }
      if (text.startsWith(end, j)) {
        close = j;
        break;
      }
      j += 1;
    }
    flush();
    if (close === -1) {
      segments.push({ kind: "raw", content: text.slice(i) });
      break;
    }
    segments.push({ kind: "math", content: text.slice(i + start.length, close), display });
    i = close + end.length;
  }
  flush();
  return segments;
}

export type Rendered = { html: string; errors: string[] };

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** Render to sanitized HTML. KaTeX output is trusted (trust: false, no \href/\url); text is escaped. */
export function renderMathText(text: string): Rendered {
  const errors: string[] = [];
  const html = splitSegments(text)
    .map((segment) => {
      if (segment.kind === "raw") {
        errors.push("Thiếu ký hiệu đóng công thức $.");
        return `<span class="math-error">${escapeHtml(segment.content)}</span>`;
      }
      if (segment.kind === "text") {
        return escapeHtml(segment.content)
          .replace(/\\unclear\{([^}]*)\}/g, '<mark class="unclear">$1</mark>')
          .replace(/\n/g, "<br/>");
      }
      try {
        return katex.renderToString(segment.content, {
          displayMode: segment.display,
          throwOnError: true,
          strict: "ignore",
          trust: false,
          macros: { ...KATEX_MACROS },
          maxExpand: 500,
          maxSize: 20,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message.replace(/^KaTeX parse error: /, "") : "lỗi";
        errors.push(`Không hiển thị được công thức “${segment.content.slice(0, 40)}”: ${message}`);
        return `<span class="math-error" title="${escapeHtml(message)}">${escapeHtml(segment.content)}</span>`;
      }
    })
    .join("");
  return { html, errors };
}
