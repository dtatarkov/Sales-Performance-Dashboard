import { describe, expect, it } from "vitest";

import { formatPercent } from "./formatPercent";

describe("formatPercent", () =>
{
  it("форматирует долю с запятой", () =>
  {
    expect(formatPercent(26.2)).toBe("26,2%");
  });

  it("null → «—» (неопределено, не 0)", () =>
  {
    expect(formatPercent(null)).toBe("\u2014");
  });

  it("0 → «0,0%» (реальный ноль)", () =>
  {
    expect(formatPercent(0)).toBe("0,0%");
  });
});
