import { describe, expect, it } from "vitest";
import { reciprocalSystemLesson, verifyReciprocalSystemCertificate } from "../src/solver/reciprocalSystemLesson";
import { latexFeedback } from "../src/solver/latexCheck";
import { cleanLanguage } from "../../shared/src/language";
import { parseExpression, splitRelation } from "../../shared/src/expr";
import { expressionSource } from "../../shared/src/expressionSource";

describe("reciprocal systems through a certified sum-product reduction", () => {
  const question = "Giải hệ phương trình $\\begin{cases}(x+y)\\left(4+\\frac{1}{xy}\\right)=1,\\\\ \\left(4x+\\frac{1}{x}\\right)\\left(4y+\\frac{1}{y}\\right)=-20.\\end{cases}$";
  it("derives and checks every ordered pair", () => {
    const relation=splitRelation('(x+y)\\left(4+\\frac{1}{xy}\\right)=1')!;
    expect(`${expressionSource(parseExpression(relation.sides[0]))}=${expressionSource(parseExpression(relation.sides[1]))}`).toBe('((x+y)*(4+(1/(x*y))))=1');
    const relation2=splitRelation('(4x+\\frac{1}{x})(4y+\\frac{1}{y})=-20')!;
    expect(`${expressionSource(parseExpression(relation2.sides[0]))}=${expressionSource(parseExpression(relation2.sides[1]))}`).toBe('(((4*x)+(1/x))*((4*y)+(1/y)))=(-20)');
    const result = reciprocalSystemLesson(question);
    expect(result).not.toBeNull();
    expect(verifyReciprocalSystemCertificate(result!.certificate)).toBe(true);
    expect(result!.certificate.pairs).toHaveLength(4);
    expect(result!.lesson.finalAnswer.text).toContain("\\frac{1}{4}");
    expect(result!.lesson.finalAnswer.text).toContain("-\\frac{1}{2}");
    expect(latexFeedback(result!.lesson)).toEqual([]);
    expect(cleanLanguage(result!.lesson).feedback).toEqual([]);
  });
  it("does not accept an unrelated system", () => expect(reciprocalSystemLesson("Giải hệ $x+y=2$." )).toBeNull());
  it("generalizes to other coefficients and variable names", () => {
    const variant="Giải hệ phương trình $\\begin{cases}(p+q)\\left(3+\\frac{1}{pq}\\right)=0,\\\\(3p+\\frac1p)(3q+\\frac1q)=-16.\\end{cases}$";
    const result=reciprocalSystemLesson(variant);
    expect(result).not.toBeNull();
    expect(result!.certificate.pairs).toHaveLength(8);
    expect(result!.lesson.finalAnswer.text).toContain("\\frac{1}{3}");
  });
});
