import { describe, expect, it } from "vitest";
import { tryEvaluateArithmetic } from "./evaluator";

function value(input: string): number {
  const result = tryEvaluateArithmetic(input);
  if (!result.ok) throw new Error(`Expected success, got error: ${result.error}`);
  return result.value;
}

function fails(input: string): boolean {
  return tryEvaluateArithmetic(input).ok === false;
}

describe("tryEvaluateArithmetic", () => {
  it("evaluates simple addition", () => {
    expect(value("2 + 2")).toBe(4);
  });

  it("evaluates all four basic operators", () => {
    expect(value("10 - 4")).toBe(6);
    expect(value("6 * 7")).toBe(42);
    expect(value("20 / 4")).toBe(5);
  });

  it("respects operator precedence", () => {
    expect(value("2 + 3 * 4")).toBe(14);
    expect(value("2 * 3 + 4")).toBe(10);
    expect(value("2 + 3 ^ 2")).toBe(11);
  });

  it("handles exponentiation right-associatively", () => {
    expect(value("2 ^ 3 ^ 2")).toBe(512);
  });

  it("handles nested parentheses", () => {
    expect(value("(2 + 3) * (4 - 1)")).toBe(15);
    expect(value("((1 + 2) * (3 + 4))")).toBe(21);
    expect(value("2 * (3 + (4 * (5 - 2)))")).toBe(30);
  });

  it("handles unary negation", () => {
    expect(value("-5 + 10")).toBe(5);
    expect(value("-(2 + 3)")).toBe(-5);
    expect(value("3 * -4")).toBe(-12);
  });

  it("handles decimals", () => {
    expect(value("1.5 + 2.5")).toBe(4);
    expect(value("0.1 + 0.2")).toBeCloseTo(0.3);
  });

  it("matches the spec's worked example", () => {
    expect(value("47 * 82")).toBe(3854);
  });

  it("fails gracefully on division by zero", () => {
    expect(fails("5 / 0")).toBe(true);
  });

  it("fails gracefully on unmatched parentheses", () => {
    expect(fails("(2 + 3")).toBe(true);
    expect(fails("2 + 3)")).toBe(true);
    expect(fails("((1 + 2)")).toBe(true);
  });

  it("fails gracefully on invalid tokens", () => {
    expect(fails("2 + abc")).toBe(true);
    expect(fails("what is 2+2")).toBe(true);
    expect(fails("2 + $5")).toBe(true);
  });

  it("fails gracefully on empty input", () => {
    expect(fails("")).toBe(true);
    expect(fails("   ")).toBe(true);
  });

  it("fails gracefully on malformed numbers", () => {
    expect(fails("1.2.3 + 1")).toBe(true);
    expect(fails(". + 1")).toBe(true);
  });

  it("does not misclassify pure prose as arithmetic", () => {
    expect(fails("explain what a transformer is")).toBe(true);
  });
});
