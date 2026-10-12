import { describe, expect, it } from "vitest";

import
{
  mapLossGroup,
  mapLossTail,
  mapLossTopItem,
} from "./lossGroup";

describe("mapLossGroup", () =>
{
  it("маппит скаляры группы и делегирует top/series/tail (возвраты)", () =>
  {
    const result = mapLossGroup(
      {
        value: 15000,
        rate: 2.5,
        rateDelta: { value: -0.4, unit: 2 },
        series: [{ value: 15000, dateFrom: "2026-09-23T00:00:00Z", dateTo: "2026-09-24T00:00:00Z" }],
        top: [
          {
            id: "p1",
            name: "Ноутбук Pro",
            category: "Ноутбуки",
            valueAbsolute: 10000,
            valueRelative: 66.7,
            valueNormalized: 100,
          },
        ],
        tail: { count: 3, valueAbsolute: 5000, valueRelative: 33.3 },
      },
      "refunds",
    );

    expect(result.value).toBe(15000);
    expect(result.rate).toBe(2.5);
    expect(result.rateDelta).toEqual({ value: -0.4, unit: "pp" });

    // Делегирование: непустые срезы прошли через свои мапперы.
    expect(result.series).toHaveLength(1);
    expect(result.top).toHaveLength(1);
    expect(result.tail).not.toBeNull();
  });

  it("nullable-поля проходят как null: rate, rateDelta, tail; top/series пустые", () =>
  {
    const result = mapLossGroup(
      {
        value: 0,
        rate: null,
        rateDelta: null,
        series: [],
        top: [],
        tail: null,
      },
      "refunds",
    );

    expect(result.value).toBe(0);
    expect(result.rate).toBeNull();
    expect(result.rateDelta).toBeNull();
    expect(result.tail).toBeNull();
    expect(result.top).toEqual([]);
    expect(result.series).toEqual([]);
  });

  it("бросает ParseError на строке вместо value", () =>
  {
    expect(() =>
      mapLossGroup(
        {
          value: "15000" as unknown as number,
          rate: null,
          rateDelta: null,
          series: [],
          top: [],
          tail: null,
        },
        "refunds",
      ),
    ).toThrow(/refunds\.value/);
  });

  it("бросает ParseError на строке вместо rate", () =>
  {
    expect(() =>
      mapLossGroup(
        {
          value: 1,
          rate: "2.5" as unknown as number,
          rateDelta: null,
          series: [],
          top: [],
          tail: null,
        },
        "refunds",
      ),
    ).toThrow(/refunds\.rate/);
  });
});

describe("mapLossTail", () =>
{
  it("маппит хвост: count, valueAbsolute, valueRelative", () =>
  {
    const tail = mapLossTail(
      { count: 3, valueAbsolute: 5000, valueRelative: 33.3 },
      "refunds.tail",
    );

    expect(tail).toEqual({
      count: 3,
      valueAbsolute: 5000,
      valueRelative: 33.3,
    });
  });

  it("null проходит как null (за топом никого не осталось)", () =>
  {
    expect(mapLossTail(null, "refunds.tail")).toBeNull();
  });

  it("бросает ParseError на строке вместо count", () =>
  {
    expect(() =>
      mapLossTail(
        { count: "3" as unknown as number, valueAbsolute: 1, valueRelative: 1 },
        "refunds.tail",
      ),
    ).toThrow(/refunds\.tail\.count/);
  });

  it("бросает ParseError на строке вместо valueAbsolute", () =>
  {
    expect(() =>
      mapLossTail(
        { count: 1, valueAbsolute: "5000" as unknown as number, valueRelative: 1 },
        "refunds.tail",
      ),
    ).toThrow(/refunds\.tail\.valueAbsolute/);
  });

  it("бросает ParseError на строке вместо valueRelative", () =>
  {
    expect(() =>
      mapLossTail(
        { count: 1, valueAbsolute: 1, valueRelative: "33.3" as unknown as number },
        "refunds.tail",
      ),
    ).toThrow(/refunds\.tail\.valueRelative/);
  });
});

describe("mapLossTopItem", () =>
{
  it("маппит все поля строки (возвраты): subtitle из category", () =>
  {
    const item = mapLossTopItem(
      {
        id: "p1",
        name: "Ноутбук Pro",
        category: "Ноутбуки",
        valueAbsolute: 10000,
        valueRelative: 66.7,
        valueNormalized: 100,
      },
      "refunds.top[0]",
    );

    expect(item.id).toBe("p1");
    expect(item.name).toBe("Ноутбук Pro");
    expect(item.subtitle).toBe("Ноутбуки");
    expect(item.valueAbsolute).toBe(10000);
    expect(item.valueRelative).toBe(66.7);
    expect(item.valueNormalized).toBe(100);
  });

  it("subtitle — команда менеджера у отмен (поле team)", () =>
  {
    const item = mapLossTopItem(
      {
        id: "m2",
        name: "Мария Смирнова",
        team: "Альфа",
        valueAbsolute: 8000,
        valueRelative: 100,
        valueNormalized: 100,
      },
      "cancellations.top[0]",
    );

    expect(item.subtitle).toBe("Альфа");
  });

  it("бросает ParseError на строке вместо valueAbsolute", () =>
  {
    expect(() =>
      mapLossTopItem(
        {
          id: "p1",
          name: "A",
          category: "B",
          valueAbsolute: "1" as unknown as number,
          valueRelative: 1,
          valueNormalized: 1,
        },
        "refunds.top[0]",
      ),
    ).toThrow(/refunds\.top\[0\]\.valueAbsolute/);
  });

  it("бросает ParseError на строке вместо valueRelative", () =>
  {
    expect(() =>
      mapLossTopItem(
        {
          id: "p1",
          name: "A",
          category: "B",
          valueAbsolute: 1,
          valueRelative: "66.7" as unknown as number,
          valueNormalized: 1,
        },
        "refunds.top[0]",
      ),
    ).toThrow(/refunds\.top\[0\]\.valueRelative/);
  });

  it("бросает ParseError на строке вместо valueNormalized", () =>
  {
    expect(() =>
      mapLossTopItem(
        {
          id: "p1",
          name: "A",
          category: "B",
          valueAbsolute: 1,
          valueRelative: 1,
          valueNormalized: "100" as unknown as number,
        },
        "refunds.top[0]",
      ),
    ).toThrow(/refunds\.top\[0\]\.valueNormalized/);
  });
});
