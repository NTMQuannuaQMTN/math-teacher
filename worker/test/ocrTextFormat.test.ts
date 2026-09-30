import { describe, expect, it } from "vitest";
import { normalizeOcrOutput } from "../src/ocr/normalize";
import { ocrTextToCompactJson, splitProblems } from "../src/ocr/textFormat";

const meta = { provider: "local", model: "paddleocr-vl", durationMs: 1 };

describe("document-OCR text → OCR result", () => {
  it("splits an exam page into its numbered questions, options staying with their question", () => {
    const page = [
      "A. PHẦN TRẮC NGHIỆM (2 điểm).",
      "**Câu 1.** Biểu thức \\(\\frac{3x}{\\sqrt{x-3}+2}\\) xác định khi và chỉ khi:",
      "A. \\(x \\ge 3\\)   B. \\(x > 3\\)",
      "Câu 2. Giá trị của \\(x_1 + x_2\\) là:",
      "A. 3  B. 4  C. 5  D. 6",
      "## Câu 3. Góc \\(\\widehat{AHC}\\) bằng:",
    ].join("\n");
    const problems = splitProblems(page);
    expect(problems.map((p) => p.label)).toEqual(["Câu 1", "Câu 2", "Câu 3"]);
    const ocr = normalizeOcrOutput(ocrTextToCompactJson(page), meta);
    expect(ocr.status).toBe("success");
    expect(ocr.language).toBe("vi");
    expect(ocr.problems).toHaveLength(3);
    expect(ocr.problems[0]!.text).toContain("$\\frac{3x}{\\sqrt{x-3}+2}$");
    expect(ocr.problems[1]!.text).toContain("D. 6");
    expect(ocr.formattedText).not.toContain("**");
  });

  it("keeps a single problem whole and wraps bare LaTeX", () => {
    const ocr = normalizeOcrOutput(ocrTextToCompactJson("Giải phương trình x^2 - 7x + 10 = 0"), meta);
    expect(ocr.problems).toHaveLength(1);
    expect(ocr.formattedText).toContain("$x^2 - 7x + 10 = 0$");
  });

  it("reports text without maths as no_math_found and empty output as unreadable", () => {
    expect(JSON.parse(ocrTextToCompactJson("Hôm nay trời đẹp quá")).status).toBe("no_math_found");
    expect(JSON.parse(ocrTextToCompactJson("   ")).status).toBe("unreadable");
  });
});
