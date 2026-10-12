import { describe, expect, it } from "vitest";

import { mapCustomerTop, mapCustomerTopItem } from "./customerTop";
import type { CustomerTopItemDto } from "../types/dto";

/** Валидная строка топ-клиента: все Δ есть, nullable-поля null. */
function createCustomerTopItemMock(): CustomerTopItemDto
{
  return {
    id: "c1",
    name: "ООО Ромашка",
    since: 2019,
    orderCount: 8,
    revenue: 320000,
    revenueDelta: { value: 12.5, unit: 1 as const },
    gp: 128000,
    gpDelta: { value: 8, unit: 1 as const },
    ac: 40000,
    acDelta: { value: -3, unit: 1 as const },
    margin: 40,
    marginDelta: { value: 1.2, unit: 2 as const },
    refundRate: 2.5,
    refundRateDelta: { value: -0.4, unit: 2 as const },
    cancelRate: 1.4,
    cancelRateDelta: { value: 0.2, unit: 2 as const },
    contribution: {
      valueAbsolute: 128000,
      valueRelative: 40,
      valueRelativeUnit: 2 as const,
      valueNormalized: 100,
    },
  };
}

describe("mapCustomerTopItem", () =>
{
  it("маппит строку: значения, Δ и contribution", () =>
  {
    const item = mapCustomerTopItem(createCustomerTopItemMock());

    expect(item.id).toBe("c1");
    expect(item.name).toBe("ООО Ромашка");
    expect(item.since).toBe(2019);
    expect(item.orderCount).toBe(8);
    expect(item.revenue).toBe(320000);
    expect(item.revenueDelta).toEqual({ value: 12.5, unit: "percent" });
    expect(item.gp).toBe(128000);
    expect(item.gpDelta).toEqual({ value: 8, unit: "percent" });
    expect(item.ac).toBe(40000);
    expect(item.acDelta).toEqual({ value: -3, unit: "percent" });
    expect(item.margin).toBe(40);
    expect(item.refundRate).toBe(2.5);
    expect(item.cancelRate).toBe(1.4);
    expect(item.cancelRateDelta).toEqual({ value: 0.2, unit: "pp" });
    expect(item.contribution.valueRelativeUnit).toBe("revenue");
  });

  it("nullable-поля (margin, refundRate, cancelRate и Δ) проходят как null", () =>
  {
    const raw = createCustomerTopItemMock();

    raw.margin = null;
    raw.marginDelta = null;
    raw.refundRate = null;
    raw.refundRateDelta = null;
    raw.cancelRate = null;
    raw.cancelRateDelta = null;

    const item = mapCustomerTopItem(raw);

    expect(item.margin).toBeNull();
    expect(item.marginDelta).toBeNull();
    expect(item.refundRate).toBeNull();
    expect(item.refundRateDelta).toBeNull();
    expect(item.cancelRate).toBeNull();
    expect(item.cancelRateDelta).toBeNull();
  });

  it("бросает ParseError на строке вместо since", () =>
  {
    const raw = createCustomerTopItemMock();

    raw.since = "2019" as unknown as number;

    expect(() => mapCustomerTopItem(raw)).toThrow(/topCustomers\.since/);
  });

  it("бросает ParseError на строке вместо orderCount", () =>
  {
    const raw = createCustomerTopItemMock();

    raw.orderCount = "8" as unknown as number;

    expect(() => mapCustomerTopItem(raw)).toThrow(/topCustomers\.orderCount/);
  });

  it("бросает ParseError на строке вместо revenue", () =>
  {
    const raw = createCustomerTopItemMock();

    raw.revenue = "320000" as unknown as number;

    expect(() => mapCustomerTopItem(raw)).toThrow(/topCustomers\.revenue/);
  });

  it("бросает ParseError на строке вместо gp", () =>
  {
    const raw = createCustomerTopItemMock();

    raw.gp = "128000" as unknown as number;

    expect(() => mapCustomerTopItem(raw)).toThrow(/topCustomers\.gp/);
  });

  it("бросает ParseError на строке вместо ac", () =>
  {
    const raw = createCustomerTopItemMock();

    raw.ac = "40000" as unknown as number;

    expect(() => mapCustomerTopItem(raw)).toThrow(/topCustomers\.ac/);
  });

  it("бросает ParseError на строке вместо margin", () =>
  {
    const raw = createCustomerTopItemMock();

    raw.margin = "40" as unknown as number;

    expect(() => mapCustomerTopItem(raw)).toThrow(/topCustomers\.margin/);
  });

  it("бросает ParseError на строке вместо refundRate", () =>
  {
    const raw = createCustomerTopItemMock();

    raw.refundRate = "2.5" as unknown as number;

    expect(() => mapCustomerTopItem(raw)).toThrow(/topCustomers\.refundRate/);
  });

  it("бросает ParseError на строке вместо cancelRate", () =>
  {
    const raw = createCustomerTopItemMock();

    raw.cancelRate = "1.4" as unknown as number;

    expect(() => mapCustomerTopItem(raw)).toThrow(/topCustomers\.cancelRate/);
  });

  it("бросает ParseError на неизвестном unit Δ", () =>
  {
    const raw = createCustomerTopItemMock();

    raw.revenueDelta = { value: 1, unit: 9 as unknown as 1 };

    expect(() => mapCustomerTopItem(raw)).toThrow(/DeltaUnit/);
  });
});

describe("mapCustomerTop", () =>
{
  it("маппит несколько датасетов с сохранением имён", () =>
  {
    const result = mapCustomerTop({
      datasets: [
        { name: "По выручке", items: [createCustomerTopItemMock()] },
        { name: "По ВП", items: [] },
      ],
    });

    expect(result.datasets).toHaveLength(2);
    expect(result.datasets[0].name).toBe("По выручке");
    expect(result.datasets[1].name).toBe("По ВП");
    expect(result.datasets[1].items).toEqual([]);
  });
});
