import { exactPolynomialRoots, rootLatex } from "../../../shared/src/rationalPolynomial";
import { ModelLessonSchema, type ModelLesson } from "../../../shared/src/solution";
import { singleAlgebraTask } from "./algebraTask";

const signed = (source: string | undefined, variable = false): number => {
  if (!source) return 0;
  const body = variable ? source.slice(0, -1) : source;
  if (body === "+") return 1;
  if (body === "-") return -1;
  return Number(body);
};

/**
 * Exact substitution for
 *   x²+bx+c-sqrt(x²+bx+d)=e.
 * The repeated quadratic is recognised structurally.  Unsupported coefficients
 * are declined, so this helper never guesses from a few numerical samples.
 */
export function radicalSubstitutionEquationLesson(text: string): ModelLesson | null {
  const task = singleAlgebraTask(text, "equation");
  if (!task) return null;
  const expression = task.expression
    .replace(/\\(?:left|right)/g, "")
    .replace(/\s+/g, "")
    .replace(/\^\{2\}/g, "^2");
  const m = /^x\^2([+-](?:\d+)?x)?([+-]\d+)?-\\sqrt\{x\^2([+-](?:\d+)?x)?([+-]\d+)?\}=([+-]?\d+)$/.exec(expression);
  if (!m || (m[1] ?? "") !== (m[3] ?? "")) return null;
  const b = signed(m[1], true), c = signed(m[2]), d = signed(m[4]), e = Number(m[5]);
  if (![b, c, d, e].every(Number.isSafeInteger)) return null;

  // t=sqrt(x²+bx+d): t>=0 and t²-t+(c-d-e)=0.
  const tRoots = exactPolynomialRoots([BigInt(c - d - e), -1n, 1n])
    .filter((r) => r.v.n === 0n && r.u.d === 1n && r.u.n >= 0n);
  const branches = tRoots.map((t) => {
    const tv = Number(t.u.n);
    const y = tv * tv - d;
    if (!Number.isSafeInteger(y)) return null;
    const roots = exactPolynomialRoots([-BigInt(y), BigInt(b), 1n]);
    return { t: tv, y, roots };
  }).filter((v): v is NonNullable<typeof v> => !!v);
  if (!branches.length) return null;
  const roots = branches.flatMap((branch) => branch.roots.map(rootLatex));
  const unique = [...new Set(roots)];
  if (!unique.length) return null;
  const branchMath = branches.map((branch) => `t=${branch.t}\\Rightarrow x^2${b < 0 ? b : `+${b}`}x-${branch.y}=0`).join("\\\\");
  const rootMath = unique.map((root) => `x=${root}`).join("\\quad \\text{hoặc}\\quad ");
  const final = `Vậy phương trình có các nghiệm ${unique.map((root) => `$x=${root}$`).join(" hoặc ")}.`;
  const authored = [
    {
      title: "Nhận ra biểu thức lặp lại dưới dấu căn",
      explanation: `Hai vế đều chứa cùng biểu thức $x^2${b < 0 ? b : `+${b}`}x$. Đặt căn thức bằng một ẩn không âm để giữ đúng điều kiện của căn bậc hai.`,
      math: `t=\\sqrt{x^2${b < 0 ? b : `+${b}`}x${d < 0 ? d : `+${d}`}},\\quad t\\ge0`,
      reason: "Đặt ẩn phụ và điều kiện của căn bậc hai",
      question: "Biểu thức nào xuất hiện cả bên ngoài và bên trong căn?",
    },
    {
      title: "Biểu diễn phần không có căn theo ẩn phụ",
      explanation: `Từ định nghĩa của $t$, bình phương hai vế cho $x^2${b < 0 ? b : `+${b}`}x=t^2-${d}$. Đây là đẳng thức tương đương vì đã giữ điều kiện $t\\ge0$.`,
      math: `x^2${b < 0 ? b : `+${b}`}x=t^2-${d}`,
      reason: "Định nghĩa ẩn phụ",
      question: "Từ $t^2=x^2+bx+d$, hãy cô lập biểu thức lặp lại.",
    },
    {
      title: "Giải phương trình theo ẩn phụ và loại giá trị âm",
      explanation: `Thay vào phương trình ban đầu được $t^2-${d}${c < 0 ? c : `+${c}`}-t=${e}$, tức là phương trình bậc hai theo $t$. Chỉ giữ nghiệm không âm vì $t$ là căn bậc hai số học.`,
      math: `t^2-t${c - d - e < 0 ? c - d - e : `+${c - d - e}`}=0\\Rightarrow ${tRoots.map((r) => `t=${rootLatex(r)}`).join("\\text{ hoặc }")}\\Rightarrow ${branches.map((r) => `t=${r.t}`).join("\\text{ hoặc }")}`,
      reason: "Giải phương trình bậc hai; điều kiện $t\\ge0$",
      question: "Nghiệm nào của phương trình theo $t$ phù hợp với điều kiện không âm?",
    },
    {
      title: "Trở lại ẩn ban đầu và giải từng phương trình bậc hai",
      explanation: "Với mỗi giá trị hợp lệ của $t$, thay vào đẳng thức ở bước 2 rồi giải đầy đủ phương trình bậc hai theo $x$.",
      math: `${branchMath}\\\\${rootMath}`,
      reason: "Công thức nghiệm phương trình bậc hai",
      question: "Mỗi giá trị của $t$ cho phương trình bậc hai nào theo $x$?",
    },
    {
      title: "Kiểm tra điều kiện và kết luận",
      explanation: `Các giá trị trên cho đúng $t=${branches.map((r) => r.t).join(" hoặc ")}$, đều không âm, nên căn thức bằng đúng $t$ chứ không phải đối của nó. Phép đặt ẩn và các phép biến đổi đều tương đương; vì vậy không có nghiệm ngoại lai và không bỏ sót nghiệm. ${final}`,
      math: rootMath,
      reason: "Đối chiếu với định nghĩa căn bậc hai và chứng minh tính đầy đủ",
      question: "Vì sao các nghiệm tìm được khôi phục đúng dấu của căn thức?",
    },
  ];
  const steps = authored.map((s, i) => ({ id: `s${i + 1}`, title: s.title, explanation: s.explanation, math: s.math, reason: s.reason, uses: i ? [`s${i}`] : [], geometryActions: [] }));
  const lesson = {
    analysis: { statement: text, language: "vi", topic: "equation", subtopic: "Phương trình chứa căn với biểu thức lặp lại", gradeLevel: 9, withinCurriculum: true, concepts: ["Ẩn phụ", "Căn bậc hai", "Phương trình bậc hai"], techniques: [], givens: [`$${task.expression}$`], unknowns: ["Tất cả nghiệm thực của phương trình"], constraints: ["$t\\ge0$"], status: "solvable", statusReason: null, interpretationNotes: [] },
    strategy: "Đặt căn thức bằng một ẩn phụ không âm, giải phương trình bậc hai theo ẩn phụ, rồi trở lại giải phương trình bậc hai theo ẩn ban đầu và kiểm tra dấu.",
    steps,
    hints: authored.slice(0, 3).map((s, i) => ({ id: `h${i + 1}`, level: Math.min(i + 1, 4) as 1 | 2 | 3 | 4, question: s.question, cue: s.reason, explanation: i < 2 ? s.explanation : "Giải phương trình bậc hai theo $t$, sau đó chỉ giữ giá trị không âm trước khi quay lại ẩn $x$.", math: i < 2 ? s.math : `t^2-t${c - d - e < 0 ? c - d - e : `+${c - d - e}`}=0,\\quad t\\ge0`, stepId: `s${i + 1}`, focus: [] })),
    finalAnswer: { text: final, math: rootMath },
    answerChecks: [{ kind: "substitute", statements: [task.expression], assignments: unique.map((root) => [{ variable: "x", value: root }]), expected: null }],
    figure: null,
  } satisfies ModelLesson;
  const parsed = ModelLessonSchema.safeParse(lesson);
  return parsed.success ? parsed.data : null;
}
