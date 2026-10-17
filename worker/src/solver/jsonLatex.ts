/**
 * A model that writes "\frac" inside a JSON string with ONE backslash produces the JSON escape \f (form feed) followed by
 * "rac" — shown to the student as "rac{3}{2}" once the control character is stripped. The same happens to \b (\begin,
 * \beta), \t (\text, \theta), \r (\right, \rho) and \n (\neq, \not). Before parsing, an unescaped backslash in front
 * of one of these known commands is doubled. Only whole command names are touched, so a real "\n" line break followed
 * by ordinary text is left alone.
 */
const JSON_ESCAPED_COMMANDS =
  /(?<!\\)((?:\\\\)*)\\(frac|forall|flat|begin|beta|bar|bigg?|binom|boxed|bullet|backslash|because|text|textbf|times|theta|tan|tfrac|triangle|tilde|to|top|right|rho|rangle|Rightarrow|Rightarrow|neq|not|notin|nabla|neg|nmid|ngeq|nleq)(?![A-Za-z])/g;
/** A single backslash before a letter that cannot start a JSON escape (\\end, \\sqrt, \\cdot…) is LaTeX: invalid JSON otherwise. */
const NON_JSON_ESCAPE = /(?<!\\)((?:\\\\)*)\\(?=[ac-eg-mo-qsv-zA-Z])/g;
export function fixJsonLatexEscapes(text: string): string {
  return text
    .replace(JSON_ESCAPED_COMMANDS, (_m, pairs: string, cmd: string) => `${pairs}\\\\${cmd}`)
    .replace(NON_JSON_ESCAPE, (_m, pairs: string) => `${pairs}\\\\`);
}

const CONTROL_ESCAPES: Record<string, string> = { "\f": "\\f", "\b": "\\b", "\t": "\\t", "\r": "\\r" };
/**
 * Last line of defence for strings already parsed somewhere without the fix: a form feed / backspace / tab / carriage
 * return directly followed by a letter is a lost LaTeX backslash ("\x0crac{3}{2}" → "\frac{3}{2}"). Applied to every
 * string of a finished lesson.
 */
export function restoreLatexControls<T>(value: T): T {
  if (typeof value === "string") return value.replace(/[\f\b\t\r](?=[A-Za-z])/g, (c) => CONTROL_ESCAPES[c]!) as T;
  if (Array.isArray(value)) return value.map(restoreLatexControls) as T;
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, restoreLatexControls(v)])) as T;
  return value;
}
