import { describe, expect, it } from "vitest";

import { mapCategoryDataset, mapCategoryItem } from "./categories";
import type { CategoryItemDto } from "../types/dto";

/** Валидная строка категории: margin есть, Δ есть. */
function createCategoryItemMock(): CategoryItemDto
{
  return {
    id: "cat1",
    name: "Ноутбуки",
    revenue: 300000,
    revenueDelta: { value: 5, unit: 1 as const },
    gp: 120000,
    gpDelta: { value: 2, unit: 1 as const },
    margin: 40,
    marginDelta: { value: 0.5, unit: 2 as const },
    salesCount: 6,
    salesCountDelta: { value: 1, unit: 1 as const },
    share: 60,
  };
}

describe("mapCategoryItem", () =>
{
  it("маппит строку категории: значения и Δ", () =>
  {
    const item = mapCategoryItem(createCategoryItemMock());

    expect(item.id).toBe("cat1");
    expect(item.name).toBe("Ноутбуки");
    expect(item.revenue).toBe(300000);
    expect(item.revenueDelta).toEqual({ value: 5, unit: "percent" });
    expect(item.gp).toBe(120000);
    expect(item.gpDelta).toEqual({ value: 2, unit: "percent" });
    expect(item.margin).toBe(40);
    expect(item.marginDelta).toEqual({ value: 0.5, unit: "pp" });
    expect(item.salesCount).toBe(6);
    expect(item.share).toBe(60);
  });

  it("nullable-поля проходят как null: margin и все Δ (пустой знаменатель)", () =>
  {
    const raw = createCategoryItemMock();

    raw.revenueDelta = null;
    raw.gpDelta = null;
    raw.margin = null;
    raw.marginDelta = null;
    raw.salesCountDelta = null;

    const item = mapCategoryItem(raw);

    expect(item.revenueDelta).toBeNull();
    expect(item.gpDelta).toBeNull();
    expect(item.margin).toBeNull();
    expect(item.marginDelta).toBeNull();
    expect(item.salesCountDelta).toBeNull();
  });

  it("бросает ParseError на строке вместо revenue", () =>
  {
    const raw = createCategoryItemMock();

    raw.revenue = "300000" as unknown as number;

    expect(() => mapCategoryItem(raw)).toThrow(/categories\.revenue/);
  });

  it("бросает ParseError на строке вместо gp", () =>
  {
    const raw = createCategoryItemMock();

    raw.gp = "120000" as unknown as number;

    expect(() => mapCategoryItem(raw)).toThrow(/categories\.gp/);
  });

  it("бросает ParseError на строке вместо margin", () =>
  {
    const raw = createCategoryItemMock();

    raw.margin = "40" as unknown as number;

    expect(() => mapCategoryItem(raw)).toThrow(/categories\.margin/);
  });

  it("бросает ParseError на строке вместо salesCount", () =>
  {
    const raw = createCategoryItemMock();

    raw.salesCount = "6" as unknown as number;

    expect(() => mapCategoryItem(raw)).toThrow(/categories\.salesCount/);
  });

  it("бросает ParseError на строке вместо share", () =>
  {
    const raw = createCategoryItemMock();

    raw.share = "60" as unknown as number;

    expect(() => mapCategoryItem(raw)).toThrow(/categories\.share/);
  });
});

describe("mapCategoryDataset", () =>
{
  it("переносит name и total, строки маппит item-маппером", () =>
  {
    const dataset = mapCategoryDataset(
      { name: "По выручке", total: 500000, items: [createCategoryItemMock()] },
      mapCategoryItem,
    );

    expect(dataset.name).toBe("По выручке");
    expect(dataset.total).toBe(500000);
    expect(dataset.items[0].revenue).toBe(300000);
  });

  it("пустой items → пустой массив, total сохранён", () =>
  {
    const dataset = mapCategoryDataset(
      { name: "По ВП", total: 0, items: [] },
      mapCategoryItem,
    );

    expect(dataset.total).toBe(0);
    expect(dataset.items).toEqual([]);
  });

  it("бросает ParseError на строке вместо total", () =>
  {
    expect(() =>
      mapCategoryDataset(
        {
          name: "По выручке",
          total: "500000" as unknown as number,
          items: [],
        },
        mapCategoryItem,
      ),
    ).toThrow(/categories\.total/);
  });
});
