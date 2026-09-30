import { describe, expect, it } from "vitest";
import { looksLikeGeometry, selectSolverModelIds } from "../src/solver/routing";

describe("looksLikeGeometry", () => {
  it.each([
    "Cho tam giác $ABC$ cân tại $A$. Tính $\\widehat{B}$.",
    "Cho đường tròn $(O; 5)$ và dây $AB = 8$.",
    "Triangle ABC is isosceles with AB = AC.",
    "Lines a and b are parallel.",
    "Tính $\\angle ABC$",
    "Chứng minh $AM \\perp BC$",
  ])("geometry: %s", (text) => expect(looksLikeGeometry(text)).toBe(true));

  it.each([
    "Giải phương trình $x^{2} - 7x + 10 = 0$",
    "Rút gọn biểu thức $A = \\frac{\\sqrt{x}}{\\sqrt{x}-1}$",
    "Solve the inequality $2(3x - 1) - 5 > 4x + 3$.",
    "Một mảnh vườn có diện tích 84 m². Tính chiều dài.",
    "Giải hệ phương trình",
  ])("not geometry: %s", (text) => expect(looksLikeGeometry(text)).toBe(false));
});

describe("selectSolverModelIds", () => {
  const base = {
    cheap: "gpt-5.4-mini",
    cheapEffort: "low",
    strong: "gpt-5.5",
    strongEffort: "medium",
    geometry: "gpt-5.4",
    geometryEffort: "medium",
  };

  it("uses the cheap model first for algebra, with strong as fallback", () => {
    expect(selectSolverModelIds("Giải phương trình $x^{2}=1$", base)).toEqual({
      primary: "gpt-5.4-mini",
      primaryEffort: "low",
      fallback: "gpt-5.5",
      fallbackEffort: "medium",
    });
  });

  it("starts geometry on the mid-tier model and keeps strong as escalate-only fallback", () => {
    expect(selectSolverModelIds("Cho tam giác ABC cân tại A", base)).toEqual({
      primary: "gpt-5.4",
      primaryEffort: "medium",
      fallback: "gpt-5.5",
      fallbackEffort: "medium",
    });
  });

  it("does not put the strong model on the first geometry attempt", () => {
    const choice = selectSolverModelIds("Triangle ABC with right angle at C", base);
    expect(choice.primary).not.toBe("gpt-5.5");
    expect(choice.fallback).toBe("gpt-5.5");
  });

  it("falls back to strong-only when geometry mid equals the strong model", () => {
    expect(selectSolverModelIds("tam giác ABC", { ...base, geometry: "gpt-5.5" })).toEqual({
      primary: "gpt-5.5",
      primaryEffort: "medium",
    });
  });

  it("uses only the cheap model when no strong fallback is configured", () => {
    expect(selectSolverModelIds("tam giác ABC", { cheap: "gpt-5.4-mini", cheapEffort: "low" })).toEqual({
      primary: "gpt-5.4-mini",
      primaryEffort: "low",
    });
  });
});

describe("selectSolverModelIds (Gemini defaults)", () => {
  const gemini = {
    cheap: "gemini-2.5-flash",
    cheapEffort: "low",
    strong: "gemini-2.5-pro",
    strongEffort: "medium",
    geometry: "gemini-2.5-flash",
    geometryEffort: "medium",
  };

  it("uses flash first for algebra and geometry, escalating to pro", () => {
    expect(selectSolverModelIds("Giải phương trình $x=1$", gemini).primary).toBe("gemini-2.5-flash");
    expect(selectSolverModelIds("Giải phương trình $x=1$", gemini).fallback).toBe("gemini-2.5-pro");
    expect(selectSolverModelIds("Cho tam giác ABC", gemini)).toEqual({
      primary: "gemini-2.5-flash",
      primaryEffort: "medium",
      fallback: "gemini-2.5-pro",
      fallbackEffort: "medium",
    });
  });
});
