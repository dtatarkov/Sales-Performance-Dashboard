import { describe, expect, it } from "vitest";

import { formatContributionLabel } from "./formatContributionLabel";
import type { Contribution } from "../types/contribution";

/** Вклад с заданной единицей и значением. */
function createContributionMock(
  valueRelativeUnit: Contribution["valueRelativeUnit"],
  valueRelative: Contribution["valueRelative"],
): Contribution
{
  return {
    valueAbsolute: 1,
    valueRelative,
    valueRelativeUnit,
    valueNormalized: 100,
  };
}

describe("formatContributionLabel", () =>
{
  it("gp → «…% от ВП периода»", () =>
  {
    const contribution = createContributionMock("gp", 26.2);

    expect(formatContributionLabel(contribution)).toBe("26,2% от ВП периода");
  });

  it("revenue → «…% от выручки периода»", () =>
  {
    const contribution = createContributionMock("revenue", 17.6);

    expect(formatContributionLabel(contribution)).toBe("17,6% от выручки периода");
  });

  it("units → «…% от объёма периода»", () =>
  {
    const contribution = createContributionMock("units", 12.3);

    expect(formatContributionLabel(contribution)).toBe("12,3% от объёма периода");
  });

  it("ac → «…× к среднему чеку» (кратность, не проценты)", () =>
  {
    const contribution = createContributionMock("ac", 1.7);

    expect(formatContributionLabel(contribution)).toBe("1,7× к среднему чеку");
  });

  it("null → «—» (вклад не определён, конвенция null ≠ 0)", () =>
  {
    const contribution = createContributionMock("gp", null);

    expect(formatContributionLabel(contribution)).toBe("—");
  });

  it("null с единицей ac → «—» (не «—× к среднему чеку»)", () =>
  {
    const contribution = createContributionMock("ac", null);

    expect(formatContributionLabel(contribution)).toBe("—");
  });
});
