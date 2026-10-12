import { describe, expect, it } from "vitest";
import
{
  mapCustomerDynamics,
  mapCustomerDynamicsItem,
} from "./customerDynamics";

describe("mapCustomerDynamicsItem", () =>
{
  it("маппит valueNormalized с абсолютной и относительной Δ", () =>
  {
    const item = mapCustomerDynamicsItem({
      id: "c1",
      name: "ООО Ромашка",
      valueNormalized: 100,
      deltaAbsolute: 35_000,
      deltaRelative: { value: 10, unit: 1 },
    });

    expect(item.id).toBe("c1");
    expect(item.name).toBe("ООО Ромашка");
    expect(item.valueNormalized).toBe(100);
    expect(item.absoluteDelta).toBe(35_000);
    expect(item.delta).toEqual({ value: 10, unit: "percent" });
  });

  it("null Δ остаётся null; отрицательная absoluteDelta (падение) проходит как есть", () =>
  {
    const item = mapCustomerDynamicsItem({
      id: "c2",
      name: "ИП Петров",
      valueNormalized: 82,
      deltaAbsolute: -9_500,
      deltaRelative: null,
    });

    expect(item.valueNormalized).toBe(82);
    expect(item.absoluteDelta).toBe(-9_500);
    expect(item.delta).toBeNull();
  });

  it("бросает ParseError на строке вместо valueNormalized", () =>
  {
    expect(() =>
      mapCustomerDynamicsItem({
        id: "c1",
        name: "A",
        valueNormalized: "25" as unknown as number,
        deltaAbsolute: 0,
        deltaRelative: null,
      }),
    ).toThrow(/customerDynamics\.valueNormalized/);
  });

  it("бросает ParseError на строке вместо deltaAbsolute", () =>
  {
    expect(() =>
      mapCustomerDynamicsItem({
        id: "c1",
        name: "A",
        valueNormalized: 25,
        deltaAbsolute: "35 000" as unknown as number,
        deltaRelative: null,
      }),
    ).toThrow(/customerDynamics\.deltaAbsolute/);
  });
});

describe("mapCustomerDynamics", () =>
{
  it("переносит готовые секции growth/decline с датасетами без нарезки и сортировки", () =>
  {
    const grossProfitGrowth = {
      name: "Валовая прибыль",
      items: [
        {
          id: "g1",
          name: "Рост 1",
          valueNormalized: 100,
          deltaAbsolute: 874_000,
          deltaRelative: null,
        },
      ],
    };

    const grossProfitDecline = {
      name: "Валовая прибыль",
      items: [
        {
          id: "d1",
          name: "Падение 1",
          valueNormalized: 45,
          deltaAbsolute: -120_000,
          deltaRelative: null,
        },
      ],
    };

    const data = mapCustomerDynamics({
      growth: [grossProfitGrowth],
      decline: [grossProfitDecline],
    });

    expect(data.growth).toHaveLength(1);
    expect(data.growth[0].items[0].id).toBe("g1");
    expect(data.decline).toHaveLength(1);
    expect(data.decline[0].items[0].id).toBe("d1");
  });
});