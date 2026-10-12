import { describe, expect, it } from "vitest";
import { mapContribution } from "./contribution";
import type { ContributionUnitDto } from '@/types/dto';

describe("mapContribution", () =>
{
  it("маппит все четыре поля", () =>
  {
    expect(
      mapContribution(
        {
          valueAbsolute: 200000,
          valueRelative: 40,
          valueRelativeUnit: 2,
          valueNormalized: 100,
        },
        "contribution",
      ),
    ).toEqual({
      valueAbsolute: 200000,
      valueRelative: 40,
      valueRelativeUnit: "revenue",
      valueNormalized: 100,
    });
  });

  it("бросает ParseError на строке вместо valueAbsolute", () =>
  {
    expect(() =>
      mapContribution(
        {
          valueAbsolute: "1" as unknown as number,
          valueRelative: 40,
          valueRelativeUnit: 2,
          valueNormalized: 1,
        },
        "topProducts.contribution",
      ),
    ).toThrow(/topProducts\.contribution\.valueAbsolute/);
  });

  it("бросает ParseError на строке вместо valueRelative", () =>
  {
    expect(() =>
      mapContribution(
        {
          valueAbsolute: 1,
          valueRelative: "40" as unknown as number,
          valueRelativeUnit: 2,
          valueNormalized: 1,
        },
        "topProducts.contribution",
      ),
    ).toThrow(/topProducts\.contribution\.valueRelative/);
  });

  it("проходит null у valueRelative как есть (конвенция null ≠ 0)", () =>
  {
    expect(
      mapContribution(
        {
          valueAbsolute: 0,
          valueRelative: null,
          valueRelativeUnit: 1,
          valueNormalized: 0,
        },
        "topProducts.contribution",
      ),
    ).toEqual({
      valueAbsolute: 0,
      valueRelative: null,
      valueRelativeUnit: "gp",
      valueNormalized: 0,
    });
  });

  it("бросает ParseError на строке вместо valueRelativeUnit", () =>
  {
    expect(() =>
      mapContribution(
        {
          valueAbsolute: 1,
          valueRelative: 40,
          valueRelativeUnit: "2" as unknown as ContributionUnitDto,
          valueNormalized: 1,
        },
        "topProducts.contribution",
      ),
    ).toThrow(/topProducts\.contribution\.valueRelativeUnit/);
  });

  it("бросает ParseError на неизвестном unit", () =>
  {
    expect(() =>
      mapContribution(
        {
          valueAbsolute: 1,
          valueRelative: 40,
          valueRelativeUnit: 7 as unknown as ContributionUnitDto,
          valueNormalized: 1,
        },
        "topProducts.contribution",
      ),
    ).toThrow(/ContributionUnit/);
  });

  it("бросает ParseError на строке вместо valueNormalized", () =>
  {
    expect(() =>
      mapContribution(
        {
          valueAbsolute: 1,
          valueRelative: 40,
          valueRelativeUnit: 2,
          valueNormalized: "1" as unknown as number,
        },
        "topProducts.contribution",
      ),
    ).toThrow(/topProducts\.contribution\.valueNormalized/);
  });
});
