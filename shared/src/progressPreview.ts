/**
 * Reads a preview from a lesson's partial JSON while it streams (fields complete so far). Display-only:
 * nothing here is verified.
 */

/** The value of a top-level-ish string field once its closing quote has arrived. */
function completeString(partial: string, key: string): string | null {
  const m = new RegExp(`"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`).exec(partial);
  if (!m) return null;
  try {
    return (JSON.parse(`"${m[1]}"`) as string).trim() || null;
  } catch {
    return null;
  }
}

export interface LessonPreview {
  problemKind: string | null;
  strategy: string | null;
  /** Steps whose object has been fully written (each step ends with its geometryActions array). */
  stepsWritten: number;
}

/** Letters that only appear in Vietnamese written with its diacritics. */
const VI_MARKED = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/iu;

/** `vietnamese`: the problem is in Vietnamese, so a problem type in English or without diacritics is not shown. */
export function previewPartialLesson(partial: string, { vietnamese = false }: { vietnamese?: boolean } = {}): LessonPreview {
  const stepsAt = partial.indexOf('"steps"');
  const steps = stepsAt >= 0 ? partial.slice(stepsAt) : "";
  const kind = completeString(partial, "subtopic");
  return {
    problemKind: kind && (!vietnamese || VI_MARKED.test(kind)) ? kind : null,
    strategy: completeString(partial, "strategy"),
    stepsWritten: (steps.match(/"geometryActions"\s*:\s*\[[^\]]*\]/g) ?? []).length,
  };
}
