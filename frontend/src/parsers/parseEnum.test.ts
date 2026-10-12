import { describe, expect, it } from "vitest";

import { parseEnum } from "./parseEnum";
import { ParseError } from "../errors/parseError";

/** Тестовый словарь enum (число → строка). */
const DICTIONARY = { 1: "paid", 2: "refunded", 3: "cancelled" } as const;

describe("parseEnum", () =>
{
  it("маппит известное значение словаря", () =>
  {
    expect(parseEnum(2, "sale.status", DICTIONARY)).toBe("refunded");
  });

  it("бросает ParseError на значении вне словаря", () =>
  {
    expect(() => parseEnum(99, "sale.status", DICTIONARY)).toThrow(ParseError);
  });

  it("бросает ParseError на отрицательном значении", () =>
  {
    expect(() => parseEnum(-1, "sale.status", DICTIONARY)).toThrow(ParseError);
  });

  it("сообщение содержит имя поля и сырое значение", () =>
  {
    expect(() => parseEnum(42, "sale.status", DICTIONARY)).toThrow(
      /sale\.status.*42/,
    );
  });
});
