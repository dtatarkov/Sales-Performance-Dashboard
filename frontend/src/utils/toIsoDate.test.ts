import { describe, expect, it } from "vitest";

import { toIsoDate } from "./toIsoDate";

describe("toIsoDate", () =>
{
  it("валидирует корректный день YYYY-MM-DD", () =>
  {
    expect(toIsoDate("2026-09-17")).toBe("2026-09-17");
  });

  it("отклоняет неверный формат: без нулей, мусор, datetime", () =>
  {
    expect(toIsoDate("2026-9-17")).toBeNull();
    expect(toIsoDate("мусор")).toBeNull();
    expect(toIsoDate("2026-09-17T00:00:00Z")).toBeNull();
  });

  it("отклоняет несуществующий календарный день", () =>
  {
    expect(toIsoDate("2026-02-30")).toBeNull();
    expect(toIsoDate("2026-13-01")).toBeNull();
  });
});
