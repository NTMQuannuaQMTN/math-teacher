import { algebraProofLesson, type AlgebraDeduction } from "../algebraProofLesson";
import { flatten } from "./text";
import type { RoutineResult } from "./numberTheory";

const lessonOf = (text: string, subtopic: string, strategy: string, details: AlgebraDeduction[], final: string, meta: { givens: string[]; unknowns: string[] }) =>
  algebraProofLesson(text, subtopic, strategy, details, final, { topic: "combinatorics", ...meta });

const singleTask = (t: string) => !/(?:^|\s)[a-e]\)|\bcâu\s+[a-e]\b/i.test(t);
const C = (n: number, k: number): number => (k < 0 || k > n ? 0 : k === 0 ? 1 : (C(n - 1, k - 1) * n) / k);
const fact = (n: number): number => (n <= 1 ? 1 : n * fact(n - 1));
/** Ordered selections (positions, offices, "xếp"…) are a different count: never answer them as combinations. */
const ORDERED = /xếp|thứ tự|chức vụ|lớp trưởng|lớp phó|giải nhất|giải nhì|vị trí|hàng ngang|hàng dọc|lần lượt/i;

function* subsets(n: number, k: number, start = 0, acc: number[] = []): Generator<number[]> {
  if (acc.length === k) { yield acc; return; }
  for (let i = start; i < n; i++) yield* subsets(n, k, i + 1, [...acc, i]);
}
function* permutations(items: number[]): Generator<number[]> {
  if (items.length <= 1) { yield items; return; }
  for (let i = 0; i < items.length; i++) for (const rest of permutations([...items.slice(0, i), ...items.slice(i + 1)])) yield [items[i]!, ...rest];
}

// ------------------------------------------------------------------------------------------- pairs among n objects
/** Matches in a single round robin, handshakes, segments through n points, diagonals of an n-gon. */
export function pairsLesson(text: string): RoutineResult | null {
  const t = flatten(text);
  if (!singleTask(t) || !/bao nhiêu|how many/i.test(t)) return null;
  let n: number | null = null, kind: "match" | "hand" | "segment" | "diagonal" | null = null;
  let m: RegExpExecArray | null;
  if ((m = /(\d+) đội/i.exec(t)) && /gặp (?:mỗi|nhau|tất cả)|thi đấu với (?:mỗi|tất cả)|đấu vòng tròn/i.test(t) && /(?:đúng|chỉ) (?:một|1) (?:lần|trận)|vòng tròn một lượt/i.test(t)) { n = +m[1]!; kind = "match"; }
  else if ((m = /(\d+) (?:người|bạn|học sinh|vị khách)/i.exec(t)) && /bắt tay/i.test(t) && /(?:đúng|một) (?:một|1)? ?lần|mỗi người bắt tay (?:với )?(?:mỗi|tất cả)/i.test(t)) { n = +m[1]!; kind = "hand"; }
  else if ((m = /(\d+) điểm/i.exec(t)) && /đoạn thẳng/i.test(t) && /không có ba điểm nào thẳng hàng|ba điểm bất kì không thẳng hàng|không có 3 điểm nào thẳng hàng/i.test(t) && !/tam giác/i.test(t)) { n = +m[1]!; kind = "segment"; }
  else if (/đường chéo/i.test(t) && (m = /đa giác (?:lồi )?(?:có )?(\d+) (?:cạnh|đỉnh)|(\d+)[ -]giác lồi/i.exec(t))) { n = +(m[1] ?? m[2])!; kind = "diagonal"; }
  if (!n || !kind || n < 3 || n > 200) return null;
  const pairs = C(n, 2), answer = kind === "diagonal" ? pairs - n : pairs;
  const obj = { match: "đội", hand: "người", segment: "điểm", diagonal: "đỉnh" }[kind];
  const what = { match: "trận đấu", hand: "cái bắt tay", segment: "đoạn thẳng", diagonal: "đường chéo" }[kind];
  const details: AlgebraDeduction[] = [
    {
      title: `Mỗi ${what} ứng với một cặp ${obj}`,
      explanation: kind === "diagonal"
        ? `Mỗi đoạn thẳng nối hai đỉnh của đa giác là một cạnh hoặc một đường chéo. Đoạn nối hai đỉnh ứng với đúng một cặp đỉnh (không kể thứ tự), và ngược lại.`
        : `Mỗi ${what} được xác định bởi đúng hai ${obj} khác nhau, không kể thứ tự (${obj} thứ nhất với ${obj} thứ hai cũng chính là ${obj} thứ hai với ${obj} thứ nhất). Ngược lại mỗi cặp ${obj} cho đúng một ${what}.`,
      math: null, reason: "Tương ứng một – một giữa đối tượng cần đếm và cặp không thứ tự", question: `Một ${what} được xác định bởi những gì?`,
    },
    {
      title: "Đếm số cặp không kể thứ tự",
      explanation: `Chọn ${obj} thứ nhất có $${n}$ cách, ${obj} thứ hai có $${n - 1}$ cách, được $${n}\\cdot${n - 1}$ cặp có thứ tự. Mỗi cặp không thứ tự được đếm đúng hai lần (đổi chỗ hai ${obj}), nên chia cho $2$.`,
      math: `\\frac{${n}\\cdot ${n - 1}}{2}=${pairs}`, reason: "Quy tắc nhân; mỗi cặp đếm hai lần", question: "Vì sao phải chia cho 2?",
    },
  ];
  if (kind === "diagonal")
    details.push({ title: "Bỏ các cạnh", explanation: `Trong $${pairs}$ đoạn nối hai đỉnh có $${n}$ cạnh của đa giác; các đoạn còn lại là đường chéo.`, math: `${pairs}-${n}=${answer}`, reason: "Phép trừ phần bù", question: "Có bao nhiêu đoạn là cạnh?" });
  const final = `Vậy có $${answer}$ ${what}.`;
  details.push({ title: "Kết luận", explanation: final, math: null, reason: "Tổng hợp", question: "Đáp số là bao nhiêu?" });
  const lesson = lessonOf(text, "Đếm cặp (tổ hợp chập 2)", "Mỗi đối tượng cần đếm ứng với một cặp không thứ tự; đếm cặp có thứ tự rồi chia 2.", details, final, { givens: [`$${n}$ ${obj}`], unknowns: [`Số ${what}`] });
  const verify = () => [...subsets(n!, 2)].length - (kind === "diagonal" ? n! : 0) === answer;
  return lesson ? { lesson, verify, label: "Liệt kê độc lập mọi cặp không thứ tự", family: `pairs-${kind}` } : null;
}

// ---------------------------------------------------------------------------------------- choose k (one/two groups)
export function chooseLesson(text: string): RoutineResult | null {
  const t = flatten(text);
  if (!singleTask(t) || !/bao nhiêu cách|how many ways/i.test(t) || !/chọn|lấy ra|cử/i.test(t) || ORDERED.test(t)) return null;
  const NOUN = "(?:học sinh|bạn|người|em|viên bi|quả|cuốn sách|quyển sách|đội viên|thành viên|tình nguyện viên)";
  const two = new RegExp(`(\\d+) (?:bạn |học sinh |em )?nam và (\\d+) (?:bạn |học sinh |em )?nữ`, "i").exec(t);
  const pick2 = /(?:chọn|lấy|cử)(?: ra)? (\d+) (?:bạn |học sinh |em )?nam và (\d+) (?:bạn |học sinh |em )?nữ/i.exec(t);
  if (two && pick2) {
    const [a, b, x, y] = [two[1], two[2], pick2[1], pick2[2]].map(Number) as [number, number, number, number];
    if (x > a || y > b || a > 40 || b > 40) return null;
    const ca = C(a, x), cb = C(b, y), answer = ca * cb;
    const details: AlgebraDeduction[] = [
      { title: "Chọn các bạn nam", explanation: `Chọn $${x}$ bạn nam trong $${a}$ bạn nam, không kể thứ tự: $C_{${a}}^{${x}}=${ca}$ cách.`, math: `C_{${a}}^{${x}}=\\frac{${a}!}{${x}!\\,${a - x}!}=${ca}`, reason: "Tổ hợp: chọn không kể thứ tự", question: "Chọn nam có bao nhiêu cách?" },
      { title: "Chọn các bạn nữ", explanation: `Tương tự, chọn $${y}$ bạn nữ trong $${b}$ bạn nữ: $C_{${b}}^{${y}}=${cb}$ cách.`, math: `C_{${b}}^{${y}}=${cb}`, reason: "Tổ hợp", question: "Chọn nữ có bao nhiêu cách?" },
      { title: "Nhân hai bước", explanation: `Mỗi cách chọn nam ghép với mỗi cách chọn nữ cho một nhóm khác nhau, và mỗi nhóm thỏa đề được tạo đúng một lần (phần nam và phần nữ của nó xác định duy nhất). Theo quy tắc nhân:`, math: `${ca}\\cdot ${cb}=${answer}`, reason: "Quy tắc nhân", question: "Vì sao nhân, không cộng?" },
    ];
    const final = `Vậy có $${answer}$ cách chọn.`;
    details.push({ title: "Kết luận", explanation: final, math: null, reason: "Tổng hợp", question: "Đáp số?" });
    const lesson = lessonOf(text, "Tổ hợp và quy tắc nhân", "Chọn riêng từng nhóm rồi nhân.", details, final, { givens: [`$${a}$ nam, $${b}$ nữ`], unknowns: ["Số cách chọn"] });
    const verify = () => {
      let count = 0;
      for (const s of subsets(a + b, x + y)) if (s.filter((i) => i < a).length === x) count++;
      return count === answer;
    };
    return lesson ? { lesson, verify, label: "Liệt kê độc lập mọi nhóm và đếm nhóm đúng số nam, nữ", family: "choose-two-groups" } : null;
  }
  const total = new RegExp(`(?:có|gồm|trong) (\\d+) ${NOUN}`, "i").exec(t);
  const pick = new RegExp(`(?:chọn|lấy|cử)(?: ra)? (\\d+) ${NOUN}`, "i").exec(t);
  if (!total || !pick || /nam|nữ|ít nhất|nhiều nhất|trong đó|không được|phải có|bắt buộc/i.test(t)) return null;
  const n = +total[1]!, k = +pick[1]!;
  if (k < 1 || k > n || n > 60) return null;
  const answer = C(n, k);
  const details: AlgebraDeduction[] = [
    { title: "Nhận dạng: chọn không kể thứ tự", explanation: `Mỗi cách chọn là một nhóm $${k}$ người trong $${n}$ người; các bạn trong nhóm không có vai trò khác nhau nên đổi thứ tự không tạo cách mới. Đây là số tổ hợp chập $${k}$ của $${n}$.`, math: null, reason: "Định nghĩa tổ hợp", question: "Thứ tự chọn có quan trọng không?" },
    { title: "Tính số tổ hợp", explanation: `Chọn lần lượt có $${Array.from({ length: k }, (_, i) => n - i).join("\\cdot ")}$ cách có thứ tự; mỗi nhóm được đếm $${k}!$ lần (số cách sắp thứ tự $${k}$ người), nên chia cho $${k}!$.`, math: `C_{${n}}^{${k}}=\\frac{${Array.from({ length: k }, (_, i) => n - i).join("\\cdot ")}}{${k}!}=${answer}`, reason: "Quy tắc nhân; mỗi nhóm đếm $k!$ lần", question: `Mỗi nhóm bị đếm lặp bao nhiêu lần?` },
  ];
  const final = `Vậy có $${answer}$ cách chọn.`;
  details.push({ title: "Kết luận", explanation: final, math: null, reason: "Tổng hợp", question: "Đáp số?" });
  const lesson = lessonOf(text, "Tổ hợp", "Chọn không kể thứ tự: đếm có thứ tự rồi chia cho số lần lặp.", details, final, { givens: [`$${n}$ người, chọn $${k}$`], unknowns: ["Số cách chọn"] });
  return lesson ? { lesson, verify: () => [...subsets(n, k)].length === answer, label: "Liệt kê độc lập mọi nhóm", family: "choose" } : null;
}

// --------------------------------------------------------------------------------------------- numbers from digits
/** "Từ các chữ số 0,1,2,3,4 lập được bao nhiêu số (chẵn|lẻ|chia hết cho 5) có k chữ số (đôi một) khác nhau". */
export function digitNumbersLesson(text: string): RoutineResult | null {
  const t = flatten(text);
  if (!singleTask(t) || !/bao nhiêu/i.test(t)) return null;
  const set = /chữ số\s*:?\s*((?:\d\s*[,;]\s*){1,9}\d)/i.exec(t);
  const len = /có (\d) chữ số|số (\d) chữ số|(ba|bốn|hai|năm) chữ số/i.exec(t);
  if (!set || !len) return null;
  const digits = [...new Set(set[1]!.split(/[,;]/).map((s) => +s.trim()))];
  const k = len[1] ? +len[1] : len[2] ? +len[2] : { hai: 2, ba: 3, bốn: 4, năm: 5 }[len[3]!.toLowerCase() as "hai"]!;
  const distinct = /khác nhau/i.test(t);
  // \b does not see Vietnamese letters as word characters ("lẻ"): use Unicode letter boundaries.
  const word = (w: string) => new RegExp(`(?<!\\p{L})${w}(?!\\p{L})`, "iu").test(t);
  const parity = word("chẵn") ? "even" : word("lẻ") ? "odd" : /chia hết cho 5(?!\d)/i.test(t) ? "five" : null;
  if ([word("chẵn"), word("lẻ"), /chia hết cho 5(?!\d)/i.test(t)].filter(Boolean).length > 1) return null;
  if (/lớn hơn|nhỏ hơn|chia hết cho (?!5\b)|tổng|bắt đầu|không bắt đầu|có mặt/i.test(t) || k < 1 || k > 6 || (distinct && k > digits.length)) return null;
  const okLast = (d: number) => (parity === "even" ? d % 2 === 0 : parity === "odd" ? d % 2 === 1 : parity === "five" ? d % 5 === 0 : true);
  // Independent count: every string of k digits from the set.
  const brute = () => {
    let count = 0;
    const rec = (acc: number[]) => {
      if (acc.length === k) { if (acc[0] !== 0 && okLast(acc[k - 1]!)) count++; return; }
      for (const d of digits) if (!distinct || !acc.includes(d)) rec([...acc, d]);
    };
    rec([]);
    return count;
  };
  const P = (n: number, r: number) => { let p = 1; for (let i = 0; i < r; i++) p *= n - i; return p; };
  const details: AlgebraDeduction[] = [];
  const S = `\\{${digits.join(",")}\\}`;
  let answer = 0;
  const hasZero = digits.includes(0);
  if (!distinct) {
    const lastChoices = digits.filter(okLast).length, firstChoices = digits.filter((d) => d !== 0).length;
    answer = k === 1 ? digits.filter((d) => okLast(d) && (d !== 0 || false)).length : firstChoices * digits.length ** Math.max(k - 2, 0) * lastChoices;
    details.push({ title: "Chọn từng chữ số (được lặp lại)", explanation: `Gọi số cần lập có $${k}$ chữ số. Chữ số đầu khác $0$: $${firstChoices}$ cách; ${k > 2 ? `mỗi chữ số ở giữa: $${digits.length}$ cách; ` : ""}chữ số cuối ${parity ? "phải thỏa điều kiện của đề: " : ": "}$${lastChoices}$ cách. Các chữ số được lặp lại nên các lựa chọn độc lập.`, math: `${firstChoices}${k > 2 ? `\\cdot ${digits.length}^{${k - 2}}` : ""}\\cdot ${lastChoices}=${answer}`, reason: "Quy tắc nhân", question: "Chữ số đầu có bao nhiêu cách chọn?" });
  } else {
    // Case on the last digit (it carries the parity condition and may be 0), then the first digit, then the middle.
    const cases: string[] = [];
    const groups = parity ? [digits.filter((d) => okLast(d) && d === 0), digits.filter((d) => okLast(d) && d !== 0)] : [];
    if (!parity && !hasZero) {
      answer = P(digits.length, k);
      details.push({ title: "Xếp các chữ số khác nhau", explanation: `Chữ số thứ nhất có $${digits.length}$ cách, chữ số thứ hai còn $${digits.length - 1}$ cách (khác chữ số đã dùng), …, chữ số thứ $${k}$ còn $${digits.length - k + 1}$ cách. Không có chữ số $0$ nên chữ số đầu không bị hạn chế thêm.`, math: `${Array.from({ length: k }, (_, i) => digits.length - i).join("\\cdot ")}=${answer}`, reason: "Quy tắc nhân (chỉnh hợp)", question: "Chữ số thứ hai còn bao nhiêu cách?" });
    } else if (!parity) {
      const first = digits.length - 1;
      answer = first * P(digits.length - 1, k - 1);
      details.push({ title: "Chữ số đầu khác 0", explanation: `Chữ số đầu khác $0$: $${first}$ cách. Mỗi chữ số tiếp theo chọn trong các chữ số chưa dùng (kể cả $0$): lần lượt $${Array.from({ length: k - 1 }, (_, i) => digits.length - 1 - i).join(", ")}$ cách.`, math: `${first}\\cdot ${Array.from({ length: k - 1 }, (_, i) => digits.length - 1 - i).join("\\cdot ")}=${answer}`, reason: "Quy tắc nhân; chữ số đầu khác 0", question: "Vì sao chữ số đầu chỉ có ít cách hơn?" });
    } else {
      const [zeroLast, otherLast] = groups as [number[], number[]];
      const word = parity === "even" ? "chẵn" : parity === "odd" ? "lẻ" : "chia hết cho 5";
      if (zeroLast.length) {
        const v = P(digits.length - 1, k - 1);
        answer += v;
        cases.push(`\\text{cuối }=0: ${Array.from({ length: k - 1 }, (_, i) => digits.length - 1 - i).join("\\cdot ")}=${v}`);
        details.push({ title: "Trường hợp chữ số cuối là 0", explanation: `Chữ số cuối là $0$ (thỏa điều kiện ${word}). Các chữ số còn lại chọn trong $${digits.length - 1}$ chữ số khác $0$, đôi một khác nhau; chữ số đầu tự động khác $0$.`, math: `${Array.from({ length: k - 1 }, (_, i) => digits.length - 1 - i).join("\\cdot ")}=${v}`, reason: "Quy tắc nhân", question: "Khi chữ số cuối là 0, chữ số đầu có bị hạn chế không?" });
      }
      if (otherLast.length) {
        const firstChoices = digits.length - 1 - (hasZero ? 1 : 0); // not the last digit, not 0
        const v = otherLast.length * firstChoices * P(digits.length - 2, k - 2);
        answer += v;
        cases.push(`\\text{cuối }\\ne0: ${otherLast.length}\\cdot ${firstChoices}${k > 2 ? `\\cdot ${Array.from({ length: k - 2 }, (_, i) => digits.length - 2 - i).join("\\cdot ")}` : ""}=${v}`);
        details.push({ title: `Trường hợp chữ số cuối khác 0`, explanation: `Chữ số cuối thuộc $\\{${otherLast.join(",")}\\}$: $${otherLast.length}$ cách. Chữ số đầu khác $0$ và khác chữ số cuối: $${firstChoices}$ cách. ${k > 2 ? `Các chữ số ở giữa chọn trong các chữ số còn lại: $${Array.from({ length: k - 2 }, (_, i) => digits.length - 2 - i).join("\\cdot ")}$ cách.` : ""}`, math: `${otherLast.length}\\cdot ${firstChoices}${k > 2 ? `\\cdot ${Array.from({ length: k - 2 }, (_, i) => digits.length - 2 - i).join("\\cdot ")}` : ""}=${v}`, reason: "Quy tắc nhân; chữ số đầu khác 0", question: "Vì sao chữ số đầu phải khác cả 0 lẫn chữ số cuối?" });
      }
      details.push({ title: "Cộng hai trường hợp", explanation: `Hai trường hợp không trùng nhau (chữ số cuối khác nhau) và bao quát mọi số thỏa đề, nên cộng lại.`, math: `${cases.map((c) => c.split("=").at(-1)).join("+")}=${answer}`, reason: "Quy tắc cộng: các trường hợp rời nhau, đầy đủ", question: "Vì sao cộng hai trường hợp?" });
    }
  }
  if (answer !== brute()) return null;
  const final = `Vậy lập được $${answer}$ số.`;
  details.unshift({ title: "Nhận dạng các điều kiện", explanation: `Các chữ số lấy từ tập $${S}$; số có $${k}$ chữ số nên chữ số đầu khác $0$${distinct ? "; các chữ số đôi một khác nhau" : "; các chữ số được phép lặp lại"}${parity ? `; điều kiện ${parity === "even" ? "chẵn" : parity === "odd" ? "lẻ" : "chia hết cho 5"} chỉ phụ thuộc chữ số cuối` : ""}.`, math: null, reason: "Phân tích đề", question: "Điều kiện nào ràng buộc chữ số đầu, chữ số cuối?" });
  details.push({ title: "Kết luận", explanation: final, math: null, reason: "Tổng hợp", question: "Đáp số?" });
  const lesson = lessonOf(text, "Lập số từ các chữ số", "Chọn lần lượt từng chữ số, xét riêng chữ số có điều kiện (đầu khác 0, cuối theo tính chẵn lẻ) trước.", details, final, { givens: [`Chữ số thuộc $${S}$`], unknowns: ["Số các số lập được"] });
  return lesson ? { lesson, verify: () => brute() === answer, label: "Liệt kê độc lập mọi dãy chữ số và đếm số thỏa điều kiện", family: "digit-numbers" } : null;
}

// --------------------------------------------------------------------------------------------- people in a row
export function rowArrangementLesson(text: string): RoutineResult | null {
  const t = flatten(text);
  if (!singleTask(t) || !/bao nhiêu cách/i.test(t) || !/xếp/i.test(t) || !/hàng|dãy ghế|hàng ghế/i.test(t) || /vòng tròn|bàn tròn/i.test(t)) return null;
  const nm = /(\d+) (?:học sinh|bạn|người|em)/i.exec(t);
  if (!nm) return null;
  const n = +nm[1]!;
  if (n < 2 || n > 8) return null;
  const names = [...t.matchAll(/(?:bạn |em )?([A-ZĐ][a-zà-ỹ]+|[A-Z])(?= )/g)].map((x) => x[1]!).filter((w) => !/^(Có|Hỏi|Xếp|Một|Từ|Trong|Cho|Biết|Giải|Tính|Tìm|Hai|Ba|Mỗi|Các)$/.test(w));
  const uniq = [...new Set(names)];
  let kind: "free" | "adjacent" | "apart" | "end" | "first" = "free";
  if (/không đứng (?:cạnh|kề|liền) nhau|không ngồi (?:cạnh|kề|liền) nhau/i.test(t)) kind = "apart";
  else if (/(?:đứng|ngồi) (?:cạnh|kề|liền) nhau/i.test(t)) kind = "adjacent";
  else if (/(?:đứng|ngồi) ở (?:một trong )?hai đầu|ở đầu hàng hoặc cuối hàng|ở một đầu hàng/i.test(t)) kind = "end";
  else if (/(?:đứng|ngồi) (?:ở )?đầu (?:hàng|dãy)|đứng đầu tiên/i.test(t)) kind = "first";
  if ((kind === "adjacent" || kind === "apart") && uniq.length !== 2) return null;
  if ((kind === "end" || kind === "first") && uniq.length !== 1) return null;
  if (kind === "free" && /cạnh|đầu|cuối|giữa|không/i.test(t)) return null;
  const f = fact(n), g = fact(n - 1);
  const answer = { free: f, adjacent: 2 * g, apart: f - 2 * g, end: 2 * g, first: g }[kind];
  const details: AlgebraDeduction[] = [];
  const [X, Y] = uniq;
  if (kind === "free") details.push({ title: "Đếm hoán vị", explanation: `Vị trí thứ nhất có $${n}$ cách chọn người, vị trí thứ hai còn $${n - 1}$ cách, …, vị trí cuối còn $1$ cách.`, math: `${n}!=${f}`, reason: "Quy tắc nhân (hoán vị)", question: "Vị trí thứ hai còn bao nhiêu cách?" });
  if (kind === "adjacent" || kind === "apart") {
    details.push({ title: `Ghép ${X} và ${Y} thành một khối`, explanation: `Khi ${X} và ${Y} đứng cạnh nhau, coi hai bạn là một "khối". Khi đó cần xếp $${n - 1}$ đối tượng (khối và $${n - 2}$ bạn còn lại): $${n - 1}!=${g}$ cách. Trong khối, ${X} đứng trước hoặc ${Y} đứng trước: $2$ cách. Mỗi cách xếp có ${X}, ${Y} cạnh nhau ứng với đúng một cặp (cách xếp khối, thứ tự trong khối), nên không bị đếm lặp.`, math: `2\\cdot ${n - 1}!=2\\cdot ${g}=${2 * g}`, reason: "Phương pháp gộp khối; quy tắc nhân", question: "Trong khối có mấy cách sắp hai bạn?" });
    if (kind === "apart") details.push({ title: "Lấy phần bù", explanation: `Tổng số cách xếp tùy ý là $${n}!=${f}$. Bỏ đi các cách có ${X}, ${Y} đứng cạnh nhau.`, math: `${f}-${2 * g}=${answer}`, reason: "Đếm phần bù", question: "Vì sao trừ?" });
  }
  if (kind === "end") details.push({ title: `Chọn chỗ cho ${X} trước`, explanation: `${X} đứng ở đầu hàng hoặc cuối hàng: $2$ cách. Sau đó xếp $${n - 1}$ bạn còn lại vào $${n - 1}$ chỗ còn lại: $${n - 1}!=${g}$ cách. Hai cách chọn chỗ cho ${X} cho các cách xếp khác nhau nên không trùng.`, math: `2\\cdot ${n - 1}!=${answer}`, reason: "Ưu tiên phần tử có điều kiện; quy tắc nhân", question: `${X} có mấy chỗ có thể đứng?` });
  if (kind === "first") details.push({ title: `Đặt ${X} ở đầu hàng`, explanation: `${X} đứng đầu hàng: $1$ cách. Xếp $${n - 1}$ bạn còn lại: $${n - 1}!=${g}$ cách.`, math: `1\\cdot ${n - 1}!=${answer}`, reason: "Quy tắc nhân", question: "Còn lại bao nhiêu bạn cần xếp?" });
  const final = `Vậy có $${answer}$ cách xếp.`;
  details.push({ title: "Kết luận", explanation: final, math: null, reason: "Tổng hợp", question: "Đáp số?" });
  const lesson = lessonOf(text, "Hoán vị có điều kiện", "Xử lí điều kiện trước (gộp khối hoặc đặt chỗ cho bạn có điều kiện), rồi xếp phần còn lại.", details, final, { givens: [`$${n}$ người phân biệt xếp thành một hàng`], unknowns: ["Số cách xếp"] });
  const verify = () => {
    let count = 0;
    for (const p of permutations(Array.from({ length: n }, (_, i) => i))) {
      const a = p.indexOf(0), b = p.indexOf(1);
      const ok = kind === "free" ? true : kind === "adjacent" ? Math.abs(a - b) === 1 : kind === "apart" ? Math.abs(a - b) !== 1 : kind === "end" ? a === 0 || a === n - 1 : a === 0;
      if (ok) count++;
    }
    return count === answer;
  };
  return lesson ? { lesson, verify, label: "Liệt kê độc lập mọi hoán vị và kiểm tra điều kiện", family: `row-${kind}` } : null;
}

// ------------------------------------------------------------------------------------------ inclusion – exclusion
export function divisibleCountLesson(text: string): RoutineResult | null {
  const t = flatten(text);
  if (!singleTask(t) || !/bao nhiêu/i.test(t)) return null;
  const range = /từ (\d+) đến (\d+)/i.exec(t) ?? /không vượt quá (\d+)()/i.exec(t);
  const or = /chia hết cho (\d+) hoặc (?:chia hết cho )?(\d+)/i.exec(t);
  if (!range || !or || /không chia hết|và chia hết|đồng thời/i.test(t)) return null;
  const lo = range[2] ? +range[1]! : 1, hi = range[2] ? +range[2] : +range[1]!;
  const a = +or[1]!, b = +or[2]!;
  if (lo !== 1 || hi > 100000 || a < 2 || b < 2 || a === b) return null;
  const g = (x: number, y: number): number => (y ? g(y, x % y) : x);
  const l = (a / g(a, b)) * b;
  const na = Math.floor(hi / a), nb = Math.floor(hi / b), nl = Math.floor(hi / l), answer = na + nb - nl;
  const details: AlgebraDeduction[] = [
    { title: `Đếm các số chia hết cho ${a} và cho ${b}`, explanation: `Các số từ $1$ đến $${hi}$ chia hết cho $${a}$ là $${a},${2 * a},\\ldots,${na * a}$: có $\\lfloor ${hi}/${a}\\rfloor=${na}$ số. Tương tự có $${nb}$ số chia hết cho $${b}$.`, math: `\\left\\lfloor\\frac{${hi}}{${a}}\\right\\rfloor=${na},\\quad \\left\\lfloor\\frac{${hi}}{${b}}\\right\\rfloor=${nb}`, reason: "Đếm bội số trong một đoạn", question: `Bội lớn nhất của $${a}$ không vượt quá $${hi}$ là bao nhiêu?` },
    { title: "Bỏ phần đếm hai lần", explanation: `Một số chia hết cho cả $${a}$ và $${b}$ đã được đếm hai lần. Số chia hết cho cả hai khi và chỉ khi chia hết cho $\\operatorname{BCNN}(${a},${b})=${l}$; có $${nl}$ số như vậy.`, math: `\\left\\lfloor\\frac{${hi}}{${l}}\\right\\rfloor=${nl}`, reason: "Chia hết cho hai số ⇔ chia hết cho BCNN", question: "Những số nào bị đếm hai lần?" },
    { title: "Áp dụng nguyên lí bù trừ", explanation: `Số các số chia hết cho $${a}$ hoặc $${b}$ bằng tổng hai số đếm trừ phần chung.`, math: `${na}+${nb}-${nl}=${answer}`, reason: "Nguyên lí bù trừ $|A\\cup B|=|A|+|B|-|A\\cap B|$", question: "Vì sao trừ phần chung một lần?" },
  ];
  const final = `Vậy có $${answer}$ số.`;
  details.push({ title: "Kết luận", explanation: final, math: null, reason: "Tổng hợp", question: "Đáp số?" });
  const lesson = lessonOf(text, "Nguyên lí bù trừ", "Đếm từng loại, rồi trừ phần bị đếm hai lần.", details, final, { givens: [`Các số từ $1$ đến $${hi}$`], unknowns: ["Số các số thỏa mãn"] });
  const verify = () => { let c = 0; for (let k = 1; k <= hi; k++) if (k % a === 0 || k % b === 0) c++; return c === answer; };
  return lesson ? { lesson, verify, label: "Đếm vét cạn độc lập từng số", family: "inclusion-exclusion" } : null;
}

// --------------------------------------------------------------------------------------------- grid rectangles
export function gridRectanglesLesson(text: string): RoutineResult | null {
  const t = flatten(text);
  if (!singleTask(t) || !/hình chữ nhật/i.test(t) || !/bao nhiêu/i.test(t)) return null;
  const v = /(\d+) đường thẳng (?:đứng|dọc|song song dọc)/i.exec(t), h = /(\d+) đường thẳng ngang/i.exec(t);
  if (!v || !h) return null;
  const a = +v[1]!, b = +h[1]!;
  if (a < 2 || b < 2 || a > 30 || b > 30) return null;
  const answer = C(a, 2) * C(b, 2);
  const details: AlgebraDeduction[] = [
    { title: "Một hình chữ nhật ứng với hai cặp đường thẳng", explanation: `Mỗi hình chữ nhật có hai cạnh đứng nằm trên hai đường thẳng đứng khác nhau và hai cạnh ngang nằm trên hai đường thẳng ngang khác nhau. Ngược lại, hai đường đứng và hai đường ngang bất kì cắt nhau tạo đúng một hình chữ nhật. Vậy đếm hình chữ nhật chính là đếm các cách chọn (cặp đường đứng, cặp đường ngang).`, math: null, reason: "Tương ứng một – một", question: "Một hình chữ nhật được xác định bởi những đường thẳng nào?" },
    { title: "Đếm các cặp", explanation: `Chọn $2$ trong $${a}$ đường đứng: $C_{${a}}^{2}=${C(a, 2)}$ cách; chọn $2$ trong $${b}$ đường ngang: $C_{${b}}^{2}=${C(b, 2)}$ cách. Theo quy tắc nhân:`, math: `${C(a, 2)}\\cdot ${C(b, 2)}=${answer}`, reason: "Tổ hợp chập 2; quy tắc nhân", question: "Chọn 2 trong các đường đứng có bao nhiêu cách?" },
  ];
  const final = `Vậy có $${answer}$ hình chữ nhật.`;
  details.push({ title: "Kết luận", explanation: final, math: null, reason: "Tổng hợp", question: "Đáp số?" });
  const lesson = lessonOf(text, "Đếm hình bằng tổ hợp", "Mỗi hình chữ nhật ứng với một cặp đường đứng và một cặp đường ngang.", details, final, { givens: [`$${a}$ đường đứng đôi một phân biệt, $${b}$ đường ngang đôi một phân biệt`], unknowns: ["Số hình chữ nhật"] });
  const verify = () => { let c = 0; for (const _ of subsets(a, 2)) for (const __ of subsets(b, 2)) c++; return c === answer; };
  return lesson ? { lesson, verify, label: "Liệt kê độc lập mọi cặp đường đứng và cặp đường ngang", family: "grid-rectangles" } : null;
}

// ------------------------------------------------------------------------------------------------ pigeonhole proofs
export function pigeonholeLesson(text: string): RoutineResult | null {
  const t = flatten(text);
  if (!singleTask(t) || !/chứng minh|chứng tỏ/i.test(t)) return null;
  let N: number, boxes: number, kind: string, m: RegExpExecArray | null;
  const objects = /(\d+) (?:người|học sinh|bạn)/i.exec(t);
  if (objects && /(?:sinh|có ngày sinh) (?:cùng|trong cùng) (?:một )?tháng/i.test(t) && /(?:ít nhất|luôn có) (?:hai|2)/i.test(t)) { N = +objects[1]!; boxes = 12; kind = "month"; }
  else if ((m = /(\d+) số (?:nguyên|tự nhiên)/i.exec(t)) && /hiệu (?:của chúng )?chia hết cho (\d+)/i.test(t) && /(?:luôn )?có (?:hai|2) số/i.test(t)) { N = +m[1]!; boxes = +/hiệu (?:của chúng )?chia hết cho (\d+)/i.exec(t)![1]!; kind = "residue"; }
  else return null;
  if (N <= boxes || boxes < 2) return null;
  const details: AlgebraDeduction[] = [];
  if (kind === "month") {
    details.push({ title: "Chọn \"lồng\" và \"thỏ\"", explanation: `Coi mỗi tháng là một lồng: có $12$ lồng. Coi mỗi người là một con thỏ: có $${N}$ con thỏ, mỗi người được đặt vào lồng là tháng sinh của mình.`, math: null, reason: "Mô hình nguyên lí Dirichlet", question: "Lồng là gì, thỏ là gì?" });
    details.push({ title: "Áp dụng nguyên lí Dirichlet", explanation: `Giả sử không có hai người nào cùng tháng sinh: mỗi lồng có nhiều nhất một người, nên số người không vượt quá $12$. Nhưng có $${N}>12$ người — mâu thuẫn. Vậy có ít nhất hai người cùng một tháng sinh.`, math: `${N}>12`, reason: "Nguyên lí Dirichlet (chứng minh phản chứng)", question: "Nếu mỗi tháng có nhiều nhất một người thì có tối đa bao nhiêu người?" });
  } else {
    details.push({ title: "Chia theo số dư", explanation: `Khi chia một số nguyên cho $${boxes}$, số dư là một trong $${boxes}$ giá trị $0,1,\\ldots,${boxes - 1}$. Coi mỗi số dư là một lồng: có $${boxes}$ lồng; $${N}$ số đã cho là $${N}$ con thỏ.`, math: null, reason: "Phép chia có dư", question: `Có bao nhiêu số dư khi chia cho $${boxes}$?` });
    details.push({ title: "Hai số cùng số dư", explanation: `Vì $${N}>${boxes}$, theo nguyên lí Dirichlet có hai số $a\\ne b$ (trong các số đã cho) có cùng số dư $r$ khi chia cho $${boxes}$: $a=${boxes}q_1+r$, $b=${boxes}q_2+r$. Khi đó hiệu của chúng chia hết cho $${boxes}$.`, math: `a-b=${boxes}(q_1-q_2)\\ \\vdots\\ ${boxes}`, reason: "Nguyên lí Dirichlet; hiệu hai số cùng số dư", question: "Hiệu của hai số cùng số dư bằng bao nhiêu?" });
  }
  const final = kind === "month" ? `Vậy trong $${N}$ người luôn có ít nhất hai người sinh cùng một tháng.` : `Vậy trong $${N}$ số nguyên bất kì luôn có hai số có hiệu chia hết cho $${boxes}$.`;
  details.push({ title: "Kết luận", explanation: final, math: null, reason: "Tổng hợp", question: "Điều cần chứng minh là gì?" });
  const lesson = lessonOf(text, "Nguyên lí Dirichlet", "Chọn lồng và thỏ thích hợp; số thỏ nhiều hơn số lồng.", details, final, { givens: [`$${N}$ đối tượng, $${boxes}$ loại`], unknowns: ["Chứng minh có hai đối tượng cùng loại"] });
  return lesson ? { lesson, verify: () => N > boxes, label: `Kiểm tra số đối tượng ${N} lớn hơn số lồng ${boxes}`, family: `pigeonhole-${kind}` } : null;
}

export const COMBINATORICS_ROUTINES = [pairsLesson, chooseLesson, digitNumbersLesson, rowArrangementLesson, divisibleCountLesson, gridRectanglesLesson, pigeonholeLesson];

// ---------------------------------------------------------------------------------------------- digit-sum counts
/** "Có bao nhiêu số tự nhiên có k chữ số mà tổng các chữ số bằng s" (k ≤ 3): cases on the leading digit. */
export function digitSumLesson(text: string): RoutineResult | null {
  const t = flatten(text);
  if (!singleTask(t) || !/bao nhiêu số/i.test(t)) return null;
  const len = /có (\d|hai|ba) chữ số/i.exec(t), sum = /tổng (?:các )?chữ số (?:của nó )?(?:bằng|là) (\d+)/i.exec(t);
  if (!len || !sum || /khác nhau|chẵn|lẻ|chia hết|lớn hơn|nhỏ hơn/i.test(t)) return null;
  const k = /^\d$/.test(len[1]!) ? +len[1]! : len[1] === "hai" ? 2 : 3, s = +sum[1]!;
  if (k < 2 || k > 3 || s < 1 || s > 9 * k) return null;
  const rows: string[] = [];
  let answer = 0;
  const waysRest = (r: number, m: number) => { let c = 0; const rec = (left: number, d: number) => { if (d === 0) { if (left === 0) c++; return; } for (let x = 0; x <= 9; x++) if (x <= left) rec(left - x, d - 1); }; rec(r, m); return c; };
  for (let a = 1; a <= 9; a++) { const w = waysRest(s - a, k - 1); if (s - a >= 0) { rows.push(`${a}&${s - a}&${w}`); answer += w; } }
  const details: AlgebraDeduction[] = [
    { title: "Xét chữ số hàng cao nhất", explanation: `Gọi chữ số đầu là $a\\in\\{1,\\ldots,9\\}$ (khác $0$). Các chữ số còn lại (mỗi chữ số từ $0$ đến $9$) có tổng $${s}-a$. Với mỗi $a$, đếm số cách chọn các chữ số còn lại; các trường hợp $a$ khác nhau cho các số khác nhau, và mọi số thỏa đề thuộc đúng một trường hợp.`, math: `\\begin{array}{c|c|c}a&\\text{tổng còn lại}&\\text{số cách}\\\\\\hline ${rows.join("\\\\")}\\end{array}`, reason: "Chia trường hợp theo chữ số đầu; quy tắc cộng", question: "Chữ số đầu có thể nhận những giá trị nào?" },
    { title: "Cộng các trường hợp", explanation: `Cộng số cách của mọi trường hợp.`, math: `${rows.map((r) => r.split("&")[2]).join("+")}=${answer}`, reason: "Quy tắc cộng", question: "Tổng bằng bao nhiêu?" },
  ];
  const final = `Vậy có $${answer}$ số.`;
  details.push({ title: "Kết luận", explanation: final, math: null, reason: "Tổng hợp", question: "Đáp số?" });
  const lesson = lessonOf(text, "Đếm số theo tổng chữ số", "Chia trường hợp theo chữ số đầu tiên.", details, final, { givens: [`Số có $${k}$ chữ số, tổng chữ số $${s}$`], unknowns: ["Số các số"] });
  const verify = () => { let c = 0; for (let n = 10 ** (k - 1); n < 10 ** k; n++) if (String(n).split("").reduce((u, d) => u + +d, 0) === s) c++; return c === answer; };
  return lesson ? { lesson, verify, label: "Duyệt độc lập mọi số có đúng số chữ số đã cho", family: "digit-sum" } : null;
}
COMBINATORICS_ROUTINES.push(digitSumLesson);
