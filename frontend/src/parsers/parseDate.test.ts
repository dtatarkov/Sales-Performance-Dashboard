import { describe, expect, it } from "vitest";

import { parseDate } from "./parseDate";
import { ParseError } from "../errors/parseError";

describe("parseDate", () =>
{
  it("парсит ISO-строку в Date", () =>
  {
    const parsed = parseDate("2026-09-17T14:32:00Z", "sale.date");

    expect(parsed.toISOString()).toBe("2026-09-17T14:32:00.000Z");
  });

  it("бросает ParseError, если значение не строка", () =>
  {
    expect(() => parseDate(123, "sale.date")).toThrow(ParseError);
  });

  it("бросает ParseError, если значение null", () =>
  {
    expect(() => parseDate(null, "sale.date")).toThrow(ParseError);
  });

  it("бросает ParseError на невалидной строке", () =>
  {
    expect(() => parseDate("не дата", "sale.date")).toThrow(ParseError);
  });

  it("сообщение содержит имя поля", () =>
  {
    expect(() => parseDate("мусор", "sale.date")).toThrow(/sale\.date/);
  });
});
