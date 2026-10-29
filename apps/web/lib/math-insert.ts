// Inserting LaTeX snippets from the symbol bar into a plain textarea. Pure functions, unit-tested.

export type Snippet = { before: string; after?: string };

const OPENERS: [string, string][] = [["$$", "$$"], ["$", "$"], ["\\(", "\\)"], ["\\[", "\\]"]];

/** Whether `pos` lies inside a math segment, using the same delimiters as `splitSegments` in `math.ts`. */
export function insideMath(text: string, pos: number): boolean {
  let i = 0;
  while (i < pos) {
    if (text[i] === "\\" && (text[i + 1] === "$" || text[i + 1] === "%" || text[i + 1] === "\\")) {
      i += 2;
      continue;
    }
    const pair = OPENERS.find(([open]) => text.startsWith(open, i));
    if (!pair) {
      i += 1;
      continue;
    }
    const [open, close] = pair;
    let j = i + open.length;
    while (j < text.length && !text.startsWith(close, j)) j += text[j] === "\\" && text[j + 1] === "$" ? 2 : 1;
    if (j >= text.length) return pos >= i + open.length; // unclosed: everything after the opener is math
    if (pos >= i + open.length && pos <= j) return true;
    i = j + close.length;
  }
  return false;
}

/** Insert `snippet` over the selection [start, end). Selected text goes where the cursor would go (so
 * selecting `x+1` then √ gives `\sqrt{x+1}`); outside math the result is wrapped in `$…$`. */
export function insertSnippet(value: string, start: number, end: number, snippet: Snippet): { value: string; caret: number } {
  const selected = value.slice(start, end);
  let latex = snippet.before + selected + (snippet.after ?? "");
  let caret = snippet.before.length + selected.length;
  if (!insideMath(value, start)) {
    latex = `$${latex}$`;
    caret += 1;
  }
  return { value: value.slice(0, start) + latex + value.slice(end), caret: start + caret };
}

/** Number of `\unclear{…}` marks left (readings of a photo the student has not confirmed yet). */
export function countUnclear(text: string): number {
  return text.split("\\unclear{").length - 1;
}

/** Keep every unclear reading as it is: `\unclear{\frac{1}{2}}` → `\frac{1}{2}` (braces matched, not regexed). */
export function acceptUnclear(text: string): string {
  const marker = "\\unclear{";
  let out = "";
  let i = 0;
  while (i < text.length) {
    const start = text.indexOf(marker, i);
    if (start === -1) return out + text.slice(i);
    let depth = 1;
    let j = start + marker.length;
    for (; j < text.length && depth > 0; j++) {
      if (text[j] === "\\") { j++; continue; }
      if (text[j] === "{") depth++;
      else if (text[j] === "}") depth--;
    }
    if (depth > 0) return out + text.slice(i); // unbalanced: leave it for the student to fix by hand
    out += text.slice(i, start) + text.slice(start + marker.length, j - 1);
    i = j;
  }
  return out;
}
