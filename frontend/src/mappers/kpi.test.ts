import { describe, expect, it } from "vitest";
import { mapBestManager, mapKpi, mapKpiCard } from "./kpi";
import
{
  createBestManagerDtoMock,
  createKpiDtoMock,
} from "../mocks/dashboardMocks";

describe("mapKpiCard", () =>
{
  it("маппит карточку: value, delta и серия точек", () =>
  {
    const card = mapKpiCard(
      {
        value: 1000,
        delta: { value: 5, unit: 1 },
        series: [{ value: 10, dateFrom: "2026-09-23T00:00:00Z", dateTo: "2026-09-24T00:00:00Z" }],
      },
      "kpi.revenue",
    );

    expect(card.value).toBe(1000);
    expect(card.delta).toEqual({ value: 5, unit: "percent" });
    expect(card.series[0].value).toBe(10);
    expect(card.series[0].date.toISOString()).toBe("2026-09-23T00:00:00.000Z");
  });

  it("delta null проходит как null (Δ не вычисляется)", () =>
  {
    const card = mapKpiCard(
      { value: 1000, delta: null, series: [{ value: 10, dateFrom: "2026-09-23T00:00:00Z", dateTo: "2026-09-24T00:00:00Z" }] },
      "kpi.revenue",
    );

    expect(card.delta).toBeNull();
    expect(card.series).toHaveLength(1);
  });

  it("пустая серия проходит как пустой массив", () =>
  {
    const card = mapKpiCard(
      { value: 1000, delta: { value: 5, unit: 1 }, series: [] },
      "kpi.revenue",
    );

    expect(card.delta).toEqual({ value: 5, unit: "percent" });
    expect(card.series).toEqual([]);
  });

  it("value null проходит как null («—» на карточке), остальное пустое", () =>
  {
    const card = mapKpiCard(
      { value: null, delta: null, series: [] },
      "kpi.revenue",
    );

    expect(card.value).toBeNull();
    expect(card.delta).toBeNull();
    expect(card.series).toEqual([]);
  });

  it("бросает ParseError на невалидной дате серии", () =>
  {
    expect(() =>
      mapKpiCard(
        {
          value: 100,
          delta: null,
          series: [{ value: 10, dateFrom: "мусор", dateTo: "2026-09-24T00:00:00Z" }],
        },
        "kpi.avgCheck",
      ),
    ).toThrow(/kpi\.avgCheck\.series\[0\]\.dateFrom/);
  });

  it("бросает ParseError на неизвестном unit delta", () =>
  {
    expect(() =>
      mapKpiCard(
        {
          value: 100,
          delta: { value: 5, unit: 9 as unknown as 1 },
          series: [],
        },
        "kpi.salesCount",
      ),
    ).toThrow(/DeltaUnit/);
  });

  it("бросает ParseError на строке вместо series value — префикс с индексом", () =>
  {
    expect(() =>
      mapKpiCard(
        {
          value: 100,
          delta: null,
          series: [{ value: "10" as unknown as number, dateFrom: "2026-09-23T00:00:00Z", dateTo: "2026-09-24T00:00:00Z" }],
        },
        "kpi.margin",
      ),
    ).toThrow(/kpi\.margin\.series\[0\]\.value/);
  });

  it("бросает ParseError на null у обязательного value", () =>
  {
    // parseNullableNumber пропускает null; проверяем сообщение через строку.
    expect(() =>
      mapKpiCard(
        { value: "1" as unknown as number, delta: null, series: [] },
        "kpi.gp",
      ),
    ).toThrow(/kpi\.gp\.value/);
  });
});

describe("mapBestManager", () =>
{
  it("маппит карточку лидера с Δ и серией", () =>
  {
    const dto = createBestManagerDtoMock();

    const result = mapBestManager(dto);

    expect(result.name).toBe("Иван Иванов");
    expect(result.gp).toBe(200000);
    expect(result.salesCount).toBe(12);
    expect(result.delta).toEqual({ value: 8, unit: "percent" });
    expect(result.series).toHaveLength(1);
  });

  it("avatar null проходит как null (показываются инициалы)", () =>
  {
    const dto = createBestManagerDtoMock();

    dto.avatar = null;

    const result = mapBestManager(dto);

    expect(result.avatar).toBeNull();
  });

  it("бросает ParseError на невалидном gp", () =>
  {
    const dto = createBestManagerDtoMock();

    dto.gp = "много" as unknown as number;

    expect(() => mapBestManager(dto)).toThrow(/kpi\.bestManager\.gp/);
  });

  it("бросает ParseError на невалидном salesCount", () =>
  {
    const dto = createBestManagerDtoMock();

    dto.salesCount = "12" as unknown as number;

    expect(() => mapBestManager(dto)).toThrow(/kpi\.bestManager\.salesCount/);
  });

  it("бросает ParseError на неизвестном unit delta лидера", () =>
  {
    const dto = createBestManagerDtoMock();

    dto.delta = { value: 8, unit: 9 as unknown as 1 };

    expect(() => mapBestManager(dto)).toThrow(/DeltaUnit/);
  });

  it("бросает ParseError на невалидной точке серии лидера", () =>
  {
    const dto = createBestManagerDtoMock();

    dto.series = [{ value: 100, dateFrom: "мусор", dateTo: "2026-09-24T00:00:00Z" }];

    expect(() => mapBestManager(dto)).toThrow(
      /kpi\.bestManager\.series\[0\]\.dateFrom/,
    );
  });
});

describe("mapKpi", () =>
{
  it("маппит пять карточек и карточку лидера из мока", () =>
  {
    const dto = createKpiDtoMock();

    const result = mapKpi(dto);

    expect(result.revenue.value).toBe(1000);
    expect(result.gp.value).toBe(400);
    expect(result.margin.value).toBe(40);
    expect(result.salesCount.value).toBe(10);
    expect(result.avgCheck.value).toBe(100);
    expect(result.bestManager?.name).toBe("Иван Иванов");
  });

  it("bestManager null проходит как null (продаж не было)", () =>
  {
    const dto = createKpiDtoMock();

    dto.bestManager = null;

    const result = mapKpi(dto);

    expect(result.bestManager).toBeNull();
  });
});
