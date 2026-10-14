/** Keeps multi-part answers readable: each exam subquestion starts on its own line. */
export function separateSubquestions(text: string): string {
  return text
    .split(/(\$\$[\s\S]*?\$\$|\$[^$]*\$)/g)
    .map((part, i) => (i % 2 === 0 ? part.replace(/[ \t]+(?=[a-f]\)\s)/giu, "\n") : part))
    .join("")
    .replace(/\n[ \t]+/g, "\n")
    .trim();
}

