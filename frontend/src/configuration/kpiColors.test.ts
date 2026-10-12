import { describe, expect, it } from "vitest";

import { kpiColorOf } from "./kpiColors";

describe("kpiColorOf", () =>
{
  it.each([
    [1, "var(--color-palette-1)"],
    [2, "var(--color-palette-2)"],
    [3, "var(--color-palette-3)"],
    [4, "var(--color-palette-4)"],
    [5, "var(--color-palette-5)"],
    [6, "var(--color-palette-6)"],
  ] as const)("номер %i → %s", (colorIndex, expected) =>
  {
    expect(kpiColorOf(colorIndex)).toBe(expected);
  });

  it("0 закручивается к последнему цвету палитры", () =>
  {
    expect(kpiColorOf(0)).toBe("var(--color-palette-20)");
  });

  it("7 — следующий цвет палитры", () =>
  {
    expect(kpiColorOf(7)).toBe("var(--color-palette-7)");
  });

  it("отрицательный номер закручивается назад по кругу (−2 → palette-18)", () =>
  {
    expect(kpiColorOf(-2)).toBe("var(--color-palette-18)");
  });

  it("полный круг (21 = 20 + 1) закручивается к 1", () =>
  {
    expect(kpiColorOf(21)).toBe("var(--color-palette-1)");
  });
});
