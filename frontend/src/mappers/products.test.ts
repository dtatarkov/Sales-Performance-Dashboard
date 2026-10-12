import { describe, expect, it } from "vitest";

import { mapProductItem } from "./products";
import type { ProductItemDto } from "../types/dto";

/** Валидная строка продукта: refundRate есть, ВП положительная. */
function createProductItemMock(): ProductItemDto
{
  return {
    id: "p1",
    name: "Ноутбук Pro",
    sku: "NP-001",
    category: "Ноутбуки",
    revenue: 150000,
    revenueDelta: { value: 10, unit: 1 as const },
    gp: 60000,
    gpDelta: { value: 3, unit: 1 as const },
    units: 3,
    unitsDelta: { value: -1, unit: 1 as const },
    margin: 40,
    marginDelta: { value: 0.8, unit: 2 as const },
    refundRate: 2.5,
    refundRateDelta: { value: -0.4, unit: 2 as const },
    contribution: {
      valueAbsolute: 60000,
      valueRelative: 20,
      valueRelativeUnit: 2 as const,
      valueNormalized: 80,
    },
  };
}

describe("mapProductItem", () =>
{
  it("маппит строку: значения, Δ и contribution units", () =>
  {
    const raw = createProductItemMock();

    raw.contribution = {
      valueAbsolute: 3,
      valueRelative: 1.7,
      valueRelativeUnit: 3,
      valueNormalized: 100,
    };

    const item = mapProductItem(raw);

    expect(item.id).toBe("p1");
    expect(item.name).toBe("Ноутбук Pro");
    expect(item.sku).toBe("NP-001");
    expect(item.category).toBe("Ноутбуки");
    expect(item.revenue).toBe(150000);
    expect(item.revenueDelta).toEqual({ value: 10, unit: "percent" });
    expect(item.gp).toBe(60000);
    expect(item.gpDelta).toEqual({ value: 3, unit: "percent" });
    expect(item.units).toBe(3);
    expect(item.unitsDelta).toEqual({ value: -1, unit: "percent" });
    expect(item.margin).toBe(40);
    expect(item.marginDelta).toEqual({ value: 0.8, unit: "pp" });
    expect(item.refundRate).toBe(2.5);
    expect(item.refundRateDelta).toEqual({ value: -0.4, unit: "pp" });
    expect(item.contribution.valueRelativeUnit).toBe("units");
  });

  it("nullable-поля (margin, refundRate и Δ) проходят как null", () =>
  {
    const raw = createProductItemMock();

    raw.margin = null;
    raw.marginDelta = null;
    raw.refundRate = null;
    raw.refundRateDelta = null;

    const item = mapProductItem(raw);

    expect(item.margin).toBeNull();
    expect(item.marginDelta).toBeNull();
    expect(item.refundRate).toBeNull();
    expect(item.refundRateDelta).toBeNull();
  });

  it("отрицательная ВП проходит как есть (ui.md)", () =>
  {
    const raw = createProductItemMock();

    raw.gp = -5000;

    const item = mapProductItem(raw);

    expect(item.gp).toBe(-5000);
  });

  it("бросает ParseError на строке вместо revenue", () =>
  {
    const raw = createProductItemMock();

    raw.revenue = "150000" as unknown as number;

    expect(() => mapProductItem(raw)).toThrow(/topProducts\.revenue/);
  });

  it("бросает ParseError на строке вместо gp", () =>
  {
    const raw = createProductItemMock();

    raw.gp = "60000" as unknown as number;

    expect(() => mapProductItem(raw)).toThrow(/topProducts\.gp/);
  });

  it("бросает ParseError на строке вместо units", () =>
  {
    const raw = createProductItemMock();

    raw.units = "3" as unknown as number;

    expect(() => mapProductItem(raw)).toThrow(/topProducts\.units/);
  });

  it("бросает ParseError на строке вместо margin", () =>
  {
    const raw = createProductItemMock();

    raw.margin = "40" as unknown as number;

    expect(() => mapProductItem(raw)).toThrow(/topProducts\.margin/);
  });

  it("бросает ParseError на строке вместо refundRate", () =>
  {
    const raw = createProductItemMock();

    raw.refundRate = "2.5" as unknown as number;

    expect(() => mapProductItem(raw)).toThrow(/topProducts\.refundRate/);
  });
});
