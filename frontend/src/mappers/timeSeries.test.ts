import { describe, expect, it } from "vitest";

import { mapTimeSeries, mapTimeSeriesPoint } from "./timeSeries";

describe("mapTimeSeriesPoint", () =>
{
  it("маппит точку: dateFrom/dateTo → Date, valueCurrent/valuePrevious числа", () =>
  {
    const point = mapTimeSeriesPoint(
      {
        dateFrom: "2026-09-17T00:00:00Z",
        dateTo: "2026-09-18T00:00:00Z",
        valueCurrent: 100,
        valuePrevious: 90,
      },
      0,
    );

    expect(point.dateFrom).toBeInstanceOf(Date);
    expect(point.dateFrom.toISOString()).toBe("2026-09-17T00:00:00.000Z");
    expect(point.dateTo).toBeInstanceOf(Date);
    expect(point.dateTo.toISOString()).toBe("2026-09-18T00:00:00.000Z");
    expect(point.valueCurrent).toBe(100);
    expect(point.valuePrevious).toBe(90);
  });

  it("valuePrevious null проходит как null (нет данных прошлого периода)", () =>
  {
    const point = mapTimeSeriesPoint(
      {
        dateFrom: "2026-09-17T00:00:00Z",
        dateTo: "2026-09-18T00:00:00Z",
        valueCurrent: 100,
        valuePrevious: null,
      },
      0,
    );

    expect(point.valuePrevious).toBeNull();
  });

  it("бросает ParseError на строке вместо valueCurrent — индекс в сообщении", () =>
  {
    expect(() =>
      mapTimeSeriesPoint(
        {
          dateFrom: "2026-09-17T00:00:00Z",
          dateTo: "2026-09-18T00:00:00Z",
          valueCurrent: "100" as unknown as number,
          valuePrevious: null,
        },
        0,
      ),
    ).toThrow(/timeSeries\[0\]\.valueCurrent/);
  });

  it("бросает ParseError на невалидной дате начала — индекс в сообщении", () =>
  {
    expect(() =>
      mapTimeSeriesPoint(
        {
          dateFrom: "мусор",
          dateTo: "2026-09-18T00:00:00Z",
          valueCurrent: 1,
          valuePrevious: null,
        },
        1,
      ),
    ).toThrow(/timeSeries\[1\]\.dateFrom/);
  });

  it("бросает ParseError на невалидной дате конца — индекс в сообщении", () =>
  {
    expect(() =>
      mapTimeSeriesPoint(
        {
          dateFrom: "2026-09-17T00:00:00Z",
          dateTo: "мусор",
          valueCurrent: 1,
          valuePrevious: null,
        },
        1,
      ),
    ).toThrow(/timeSeries\[1\]\.dateTo/);
  });
});

describe("mapTimeSeries", () =>
{
  it("маппит несколько датасетов с сохранением имён и порядка", () =>
  {
    const result = mapTimeSeries({
      datasets: [
        {
          name: "Выручка",
          items: [
            {
              dateFrom: "2026-09-17T00:00:00Z",
              dateTo: "2026-09-18T00:00:00Z",
              valueCurrent: 100,
              valuePrevious: 90,
            },
          ],
        },
        {
          name: "СЧ",
          items: [],
        },
      ],
    });

    expect(result.datasets).toHaveLength(2);
    expect(result.datasets[0].name).toBe("Выручка");
    expect(result.datasets[0].items).toHaveLength(1);
    expect(result.datasets[1].name).toBe("СЧ");
    expect(result.datasets[1].items).toEqual([]);
  });
});
