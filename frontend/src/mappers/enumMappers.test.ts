import { describe, expect, it } from "vitest";

import
{
  mapSegment,
  mapSegmentToDto,
  mapDeltaUnit,
  mapContributionUnit,
  mapSaleStatus,
} from "./enumMappers";

describe("mapSegment", () =>
{
  it("маппит 1/2/3 в enterprise/mid-market/smb", () =>
  {
    expect(mapSegment(1)).toBe("enterprise");
    expect(mapSegment(2)).toBe("mid-market");
    expect(mapSegment(3)).toBe("smb");
  });

  it("бросает ParseError на неизвестном значении", () =>
  {
    expect(() => mapSegment(9)).toThrow(/Segment/);
  });
});

describe("mapSegmentToDto", () =>
{
  it("маппит enterprise/mid-market/smb в 1/2/3", () =>
  {
    expect(mapSegmentToDto("enterprise")).toBe(1);
    expect(mapSegmentToDto("mid-market")).toBe(2);
    expect(mapSegmentToDto("smb")).toBe(3);
  });

  it("null проходит как null (все сегменты)", () =>
  {
    expect(mapSegmentToDto(null)).toBeNull();
  });
});

describe("mapDeltaUnit", () =>
{
  it("маппит 1/2 в percent/pp", () =>
  {
    expect(mapDeltaUnit(1)).toBe("percent");
    expect(mapDeltaUnit(2)).toBe("pp");
  });

  it("бросает ParseError на неизвестном значении", () =>
  {
    expect(() => mapDeltaUnit(9)).toThrow(/DeltaUnit/);
  });
});

describe("mapContributionUnit", () =>
{
  it("маппит 1/2/3/4 в gp/revenue/units/ac", () =>
  {
    expect(mapContributionUnit(1)).toBe("gp");
    expect(mapContributionUnit(2)).toBe("revenue");
    expect(mapContributionUnit(3)).toBe("units");
    expect(mapContributionUnit(4)).toBe("ac");
  });

  it("бросает ParseError на неизвестном значении", () =>
  {
    expect(() => mapContributionUnit(9)).toThrow(/ContributionUnit/);
  });
});

describe("mapSaleStatus", () =>
{
  it("маппит 1/2/3 в paid/refunded/cancelled", () =>
  {
    expect(mapSaleStatus(1)).toBe("paid");
    expect(mapSaleStatus(2)).toBe("refunded");
    expect(mapSaleStatus(3)).toBe("cancelled");
  });

  it("бросает ParseError на неизвестном значении", () =>
  {
    expect(() => mapSaleStatus(9)).toThrow(/SaleStatus/);
  });
});
