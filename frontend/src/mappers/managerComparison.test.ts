import { describe, expect, it } from "vitest";

import { mapManagerComparisonItem } from "./managerComparison";

describe("mapManagerComparisonItem", () =>
{
  it("маппит строку: value и Δ percent", () =>
  {
    const item = mapManagerComparisonItem({
      id: "m1",
      name: "Иван Иванов",
      team: "Alpha",
      value: 500000,
      delta: { value: 12.5, unit: 1 },
    });

    expect(item.id).toBe("m1");
    expect(item.name).toBe("Иван Иванов");
    expect(item.team).toBe("Alpha");
    expect(item.value).toBe(500000);
    expect(item.delta).toEqual({ value: 12.5, unit: "percent" });
  });

  it("null Δ остаётся null", () =>
  {
    const item = mapManagerComparisonItem({
      id: "m1",
      name: "A",
      team: "Beta",
      value: 1,
      delta: null,
    });

    expect(item.delta).toBeNull();
  });

  it("бросает ParseError на строке вместо value", () =>
  {
    expect(() =>
      mapManagerComparisonItem({
        id: "m1",
        name: "A",
        team: "Beta",
        value: "500000" as unknown as number,
        delta: null,
      }),
    ).toThrow(/managerComparison\.value/);
  });
});
