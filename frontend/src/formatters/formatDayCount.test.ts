import { describe, expect, it } from "vitest";

import { formatDayCount } from "./formatDayCount";

describe("formatDayCount", () =>
{
  it.each([
    [1, "1 день"],
    [7, "7 дней"],
    [23, "23 дня"],
  ] as const)("согласует слово с числом: %i → «%s»", (dayCount, expected) =>
  {
    expect(formatDayCount(dayCount)).toBe(expected);
  });

  it("формат числа — ru-RU (неразрывные пробелы разрядов)", () =>
  {
    expect(formatDayCount(1000)).toBe("1\u00A0000 дней");
  });
});
