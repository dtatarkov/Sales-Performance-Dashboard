import { describe, expect, it } from "vitest";

import { mapDelta } from "./delta";
import { ParseError } from "../errors/parseError";
import type { DeltaUnitDto } from '@/types/dto';

describe("mapDelta", () =>
{
  it("маппит percent (unit 1) и pp (unit 2)", () =>
  {
    expect(mapDelta({ value: 12.5, unit: 1 }, "d")).toEqual({
      value: 12.5,
      unit: "percent",
    });

    expect(mapDelta({ value: -0.4, unit: 2 }, "d")).toEqual({
      value: -0.4,
      unit: "pp",
    });
  });

  it("null проходит как есть (Δ не вычисляется)", () =>
  {
    expect(mapDelta(null, "d")).toBeNull();
  });

  it("бросает ParseError на строке вместо числа", () =>
  {
    expect(() =>
      mapDelta(
        { value: "12.5" as unknown as number, unit: 1 },
        "revenueDelta",
      ),
    ).toThrow(ParseError);
  });

  it("бросает ParseError на неизвестном unit", () =>
  {
    expect(() =>
      mapDelta(
        { value: 1, unit: 9 as unknown as DeltaUnitDto },
        "revenueDelta",
      ),
    ).toThrow(/DeltaUnit/);
  });
});
