import { describe, expect, it } from "vitest";

import {
  formatBucketRange,
  formatDate,
  formatDateShort,
  formatDateTime,
} from "./formatDate";
import { formatMoney } from "./formatMoney";

describe("formatDate", () =>
{
  it("форматирует дату по-русски с сокращённым месяцем", () =>
  {
    expect(formatDate(new Date("2026-09-17T00:00:00Z"))).toBe("17 сент. 2026");
  });
});

describe("formatDateShort", () =>
{
  it("форматирует дату без года", () =>
  {
    expect(formatDateShort(new Date("2026-09-17T00:00:00Z"))).toBe("17 сент.");
  });
});

describe("formatDateTime", () =>
{
  it("форматирует ленту продаж: «23.09 14:32»", () =>
  {
    expect(formatDateTime(new Date("2026-09-23T14:32:00Z"))).toBe("23.09 14:32");
  });
});

describe("formatBucketRange", () =>
{
  it("однодневный период — только часы, без дня", () =>
  {
    const result = formatBucketRange(
      new Date("2026-09-17T05:00:00Z"),
      new Date("2026-09-17T06:00:00Z"),
      true,
    );

    expect(result).toBe("05:00 – 06:00");
  });

  it("бакет в одних сутках — день один раз, время с минутами", () =>
  {
    const result = formatBucketRange(
      new Date("2026-09-17T10:00:00Z"),
      new Date("2026-09-17T12:00:00Z"),
      false,
    );

    expect(result).toBe("17 сент., 10:00 – 12:00");
  });

  it("бакет через границу суток — день у каждой границы", () =>
  {
    const result = formatBucketRange(
      new Date("2026-09-17T10:00:00Z"),
      new Date("2026-09-18T00:00:00Z"),
      false,
    );

    expect(result).toBe("17 сент. 10:00 – 18 сент. 00:00");
  });
});

describe("formatMoney", () =>
{
  it("граничные суммы", () =>
  {
    expect(formatMoney(999)).toBe("999 ₽");
    expect(formatMoney(1000)).toBe("1 тыс ₽");
    expect(formatMoney(999_999)).toBe("1000 тыс ₽");
    expect(formatMoney(1_000_000)).toBe("1 млн ₽");
  });
});