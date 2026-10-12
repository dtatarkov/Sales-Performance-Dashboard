import { describe, expect, it } from "vitest";

import { mapSeriesPoint } from "./series";

describe("mapSeriesPoint", () =>
{
  it("маппит точку: value — число, dateFrom — Date", () =>
  {
    const point = mapSeriesPoint(
      { value: 15000, dateFrom: "2026-09-23T00:00:00Z", dateTo: "2026-09-24T00:00:00Z" },
      "kpi.revenue.series",
      2,
    );

    expect(point.value).toBe(15000);
    expect(point.date).toBeInstanceOf(Date);
    expect(point.date.toISOString()).toBe("2026-09-23T00:00:00.000Z");
  });

  it("бросает ParseError на строке вместо value — индекс в сообщении", () =>
  {
    expect(() =>
      mapSeriesPoint(
        { value: "1" as unknown as number, dateFrom: "2026-09-23T00:00:00Z", dateTo: "2026-09-24T00:00:00Z" },
        "kpi.revenue.series",
        3,
      ),
    ).toThrow(/kpi\.revenue\.series\[3\]\.value/);
  });

  it("бросает ParseError на невалидной дате — индекс в сообщении", () =>
  {
    expect(() =>
      mapSeriesPoint(
        { value: 1, dateFrom: "не дата", dateTo: "2026-09-24T00:00:00Z" },
        "kpi.revenue.series",
        0,
      ),
    ).toThrow(/kpi\.revenue\.series\[0\]\.dateFrom/);
  });
});
