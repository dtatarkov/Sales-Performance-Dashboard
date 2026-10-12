import { describe, expect, it } from "vitest";

import { expandDayBoundaries } from "./expandDayBoundaries";
import { toIsoDate } from "./toIsoDate";

/** Строит IsoDate в тесте; строка заведомо валидна (константы). */
function isoDay(value: string)
{
  const day = toIsoDate(value);

  expect(day).not.toBeNull();

  return day!;
}

describe("expandDayBoundaries", () =>
{
  it("раскрывает диапазон дней в полуинтервал [from 00:00Z, to+1 день 00:00Z)", () =>
  {
    const range = expandDayBoundaries(isoDay("2026-09-17"), isoDay("2026-09-23"));

    expect(range.fromUtc.toISOString()).toBe("2026-09-17T00:00:00.000Z");
    expect(range.toUtc.toISOString()).toBe("2026-09-24T00:00:00.000Z");
  });

  it("края месяца: один день — сутки ровно", () =>
  {
    const day = isoDay("2026-08-31");

    const range = expandDayBoundaries(day, day);

    expect(range.fromUtc.toISOString()).toBe("2026-08-31T00:00:00.000Z");
    expect(range.toUtc.toISOString()).toBe("2026-09-01T00:00:00.000Z");
  });

  it("год перехода: конец декабря → начало января", () =>
  {
    const day = isoDay("2025-12-31");

    const range = expandDayBoundaries(day, day);

    expect(range.toUtc.toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });

  it("29 февраля високосного года — сутки ровно", () =>
  {
    const day = isoDay("2028-02-29");

    const range = expandDayBoundaries(day, day);

    expect(range.fromUtc.toISOString()).toBe("2028-02-29T00:00:00.000Z");
    expect(range.toUtc.toISOString()).toBe("2028-03-01T00:00:00.000Z");
  });

  it("to < from (невалидная пара) — не нормализуется: границы как есть", () =>
  {
    const range = expandDayBoundaries(isoDay("2026-09-23"), isoDay("2026-09-17"));

    expect(range.fromUtc.toISOString()).toBe("2026-09-23T00:00:00.000Z");
    expect(range.toUtc.toISOString()).toBe("2026-09-18T00:00:00.000Z");
  });
});
