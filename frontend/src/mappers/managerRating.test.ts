import { describe, expect, it } from "vitest";

import { mapManagerRatingItem } from "./managerRating";
import { createManagerRatingItemMock } from "../mocks/dashboardMocks";

describe("mapManagerRatingItem", () =>
{
  it("маппит строку с Δ percent/pp и contribution revenue", () =>
  {
    const item = mapManagerRatingItem(createManagerRatingItemMock());

    expect(item.id).toBe("m1");
    expect(item.name).toBe("Иван Иванов");
    expect(item.team).toBe("Альфа");
    expect(item.salesCount).toBe(12);
    expect(item.revenue).toBe(500000);
    expect(item.revenueDelta).toEqual({ value: 12.5, unit: "percent" });
    expect(item.gpDelta).toEqual({ value: 8, unit: "percent" });
    expect(item.marginDelta).toEqual({ value: 1.2, unit: "pp" });
    expect(item.margin).toBe(40);
    expect(item.contribution.valueRelativeUnit).toBe("revenue");
  });

  it("nullable-поля (margin, cancelRate и их Δ) проходят как null", () =>
  {
    const raw = createManagerRatingItemMock();

    raw.margin = null;
    raw.marginDelta = null;
    raw.cancelRate = null;
    raw.cancelRateDelta = null;

    const item = mapManagerRatingItem(raw);

    expect(item.margin).toBeNull();
    expect(item.marginDelta).toBeNull();
    expect(item.cancelRate).toBeNull();
    expect(item.cancelRateDelta).toBeNull();
  });

  it("avatar null проходит как null", () =>
  {
    const raw = createManagerRatingItemMock();

    raw.avatar = null;

    expect(mapManagerRatingItem(raw).avatar).toBeNull();
  });

  it("бросает ParseError на строке вместо salesCount", () =>
  {
    const raw = createManagerRatingItemMock();

    raw.salesCount = "12" as unknown as number;

    expect(() => mapManagerRatingItem(raw)).toThrow(/managerRating\.salesCount/);
  });

  it("бросает ParseError на строке вместо revenue", () =>
  {
    const raw = createManagerRatingItemMock();

    raw.revenue = "500000" as unknown as number;

    expect(() => mapManagerRatingItem(raw)).toThrow(/managerRating\.revenue/);
  });

  it("бросает ParseError на строке вместо gp", () =>
  {
    const raw = createManagerRatingItemMock();

    raw.gp = "200000" as unknown as number;

    expect(() => mapManagerRatingItem(raw)).toThrow(/managerRating\.gp/);
  });

  it("бросает ParseError на строке вместо ac", () =>
  {
    const raw = createManagerRatingItemMock();

    raw.ac = "41666.67" as unknown as number;

    expect(() => mapManagerRatingItem(raw)).toThrow(/managerRating\.ac/);
  });

  it("бросает ParseError на строке вместо margin", () =>
  {
    const raw = createManagerRatingItemMock();

    raw.margin = "40" as unknown as number;

    expect(() => mapManagerRatingItem(raw)).toThrow(/managerRating\.margin/);
  });

  it("бросает ParseError на строке вместо cancelRate", () =>
  {
    const raw = createManagerRatingItemMock();

    raw.cancelRate = "1.4" as unknown as number;

    expect(() => mapManagerRatingItem(raw)).toThrow(/managerRating\.cancelRate/);
  });
});
