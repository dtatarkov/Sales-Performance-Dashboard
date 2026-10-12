import { describe, expect, it } from "vitest";

import { formatToIsoDate } from "./formatToIsoDate";

describe("formatToIsoDate", () =>
{
  it("форматирует календарные компоненты даты в YYYY-MM-DD", () =>
  {
    // Локальный конструктор: геттеры вернут эти же компоненты в любой TZ.
    const date = new Date(2026, 8, 23);

    expect(formatToIsoDate(date)).toBe("2026-09-23");
  });

  it("дополняет месяц и день нулями", () =>
  {
    const date = new Date(2026, 0, 5);

    expect(formatToIsoDate(date)).toBe("2026-01-05");
  });
});
