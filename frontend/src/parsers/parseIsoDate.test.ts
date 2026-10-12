import { describe, expect, it } from "vitest";

import { parseIsoDate } from "./parseIsoDate";

describe("parseIsoDate", () =>
{
  it("парсит ISO UTC строку", () =>
  {
    const parsed = parseIsoDate("2026-09-17T00:00:00Z");

    expect(parsed.toISOString()).toBe("2026-09-17T00:00:00.000Z");
  });

  it("парсит день YYYY-MM-DD как UTC-полночь", () =>
  {
    const parsed = parseIsoDate("2026-09-17");

    expect(parsed.toISOString()).toBe("2026-09-17T00:00:00.000Z");
  });
});
