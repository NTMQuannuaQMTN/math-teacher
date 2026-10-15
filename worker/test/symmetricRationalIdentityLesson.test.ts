import { describe, expect, it } from "vitest";
import { symmetricRationalIdentityLesson, verifySymmetricRationalCertificate } from "../src/solver/symmetricRationalIdentityLesson";
import { latexFeedback } from "../src/solver/latexCheck";
import { cleanLanguage } from "../../shared/src/language";

describe("symmetric rational identities", () => {
  it.each([
    "Cho $a,b,c$ là các số thực khác $0$, thỏa mãn $a+b+c\\ne0$ và $ab+bc+ca=0$. Tính $P=\\frac{1}{a^2-bc}+\\frac{1}{b^2-ca}+\\frac{1}{c^2-ab}$.",
    "Cho các số thực $a,b,c$ thỏa mãn $ab+bc+ca=1$. Tính $P=\\frac{a}{1+a^2}+\\frac{b}{1+b^2}+\\frac{c}{1+c^2}-\\frac{2}{a+b+c-abc}$.",
  ])("builds a complete checked lesson for %s", (question) => {
    const result = symmetricRationalIdentityLesson(question);
    expect(result).not.toBeNull();
    expect(verifySymmetricRationalCertificate(result!.certificate)).toBe(true);
    expect(result!.lesson.finalAnswer.text).toContain("P=0");
    expect(latexFeedback(result!.lesson)).toEqual([]);
    expect(cleanLanguage(result!.lesson).feedback).toEqual([]);
  });
  it("does not route a superficially similar expression with another condition", () => {
    expect(symmetricRationalIdentityLesson("Cho $a,b,c$ thỏa $ab+bc+ca=2$. Tính $P=\\frac{1}{a^2-bc}$." )).toBeNull();
  });
});
