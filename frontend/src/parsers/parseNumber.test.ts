import { describe, expect, it } from "vitest";

import { parseNumber, parseNullableNumber } from "./parseNumber";
import { ParseError } from "../errors/parseError";

describe("parseNumber", () =>
{
  it("проходит число как есть", () =>
  {
    expect(parseNumber(42, "kpi.revenue")).toBe(42);
  });

  it("проходит отрицательное и дробное", () =>
  {
    expect(parseNumber(-1.5, "delta.value")).toBe(-1.5);
  });

  it("бросает ParseError на строке", () =>
  {
    expect(() => parseNumber("42", "kpi.revenue")).toThrow(ParseError);
  });

  it("бросает ParseError на null", () =>
  {
    expect(() => parseNumber(null, "kpi.revenue")).toThrow(ParseError);
  });

  it("бросает ParseError на NaN", () =>
  {
    expect(() => parseNumber(Number.NaN, "kpi.revenue")).toThrow(ParseError);
  });

  it("сообщение содержит имя поля", () =>
  {
    expect(() => parseNumber("мусор", "kpi.revenue")).toThrow(/kpi\.revenue/);
  });
});

describe("parseNullableNumber", () =>
{
  it("null проходит как есть (конвенция null ≠ 0)", () =>
  {
    expect(parseNullableNumber(null, "product.gp")).toBeNull();
  });

  it("число проверяется как обычный parseNumber", () =>
  {
    expect(parseNullableNumber(7, "product.gp")).toBe(7);
  });

  it("бросает ParseError на строке", () =>
  {
    expect(() => parseNullableNumber("7", "product.gp")).toThrow(ParseError);
  });
});
