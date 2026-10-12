import { describe, expect, it } from "vitest";

import type { IsoDate } from "../types/isoDate";
import { formatDayLabel } from "./formatDayLabel";

describe("formatDayLabel", () =>
{
  it.each([
    ["2026-09-17", "17 сентября 2026"],
    ["2026-01-01", "1 января 2026"],
    ["2026-12-31", "31 декабря 2026"],
    ["2024-02-29", "29 февраля 2024"],
  ] as const)("форматирует день: %s → «%s»", (day, expected) =>
  {
    expect(formatDayLabel(day as IsoDate)).toBe(expected);
  });

  it("не ведёт число с нуля (день из двух цифр в строке)", () =>
  {
    expect(formatDayLabel("2026-09-07" as IsoDate)).toBe("7 сентября 2026");
  });
});
