import { describe, expect, it } from "vitest";

import { cycleNumber } from "./cycleNumber";

describe("cycleNumber", () =>
{
  it.each([
    [0, 6, 0],
    [1, 6, 1],
    [5, 6, 5],
  ] as const)("значение в диапазоне: %i (круг %i) → %i", (value, count, expected) =>
  {
    expect(cycleNumber(value, count)).toBe(expected);
  });

  it("выше диапазона закручивается: 7 при круге 6 → 1", () =>
  {
    expect(cycleNumber(7, 6)).toBe(1);
  });

  it("граница ровно в count → 0", () =>
  {
    expect(cycleNumber(6, 6)).toBe(0);
  });

  it("отрицательное закручивается в конец: -1 при круге 6 → 5", () =>
  {
    expect(cycleNumber(-1, 6)).toBe(5);
  });

  it("отрицательное закручивается: -2 при круге 6 → 4", () =>
  {
    expect(cycleNumber(-2, 6)).toBe(4);
  });

  it("несколько кругов: 13 при круге 6 → 1", () =>
  {
    expect(cycleNumber(13, 6)).toBe(1);
  });

  it("круг длины 1 всегда → 0", () =>
  {
    expect(cycleNumber(42, 1)).toBe(0);
  });
});
