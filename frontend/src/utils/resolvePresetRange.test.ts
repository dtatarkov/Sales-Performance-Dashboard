import { describe, expect, it } from "vitest";

import { resolvePresetRange } from "./resolvePresetRange";

// Фиксированный момент: среда 2026-09-23 15:30 UTC.
const NOW = new Date("2026-09-23T15:30:00Z");

describe("resolvePresetRange", () =>
{
  it("today — только день момента now", () =>
  {
    expect(resolvePresetRange("today", NOW)).toEqual({
      from: "2026-09-23",
      to: "2026-09-23",
    });
  });

  it("7d — окно 7 календарных дней, сегодня включительно", () =>
  {
    expect(resolvePresetRange("7d", NOW)).toEqual({
      from: "2026-09-17",
      to: "2026-09-23",
    });
  });

  it("30d — окно 30 календарных дней", () =>
  {
    expect(resolvePresetRange("30d", NOW)).toEqual({
      from: "2026-08-25",
      to: "2026-09-23",
    });
  });

  it("this-month — с 1-го числа месяца по сегодня", () =>
  {
    expect(resolvePresetRange("this-month", NOW)).toEqual({
      from: "2026-09-01",
      to: "2026-09-23",
    });
  });

  it("last-month — полный предыдущий месяц", () =>
  {
    expect(resolvePresetRange("last-month", NOW)).toEqual({
      from: "2026-08-01",
      to: "2026-08-31",
    });
  });

  it("last-month в январе переходит через год", () =>
  {
    const januaryNow = new Date("2026-01-15T12:00:00Z");

    expect(resolvePresetRange("last-month", januaryNow)).toEqual({
      from: "2025-12-01",
      to: "2025-12-31",
    });
  });
});
