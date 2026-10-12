import { describe, expect, it } from "vitest";

import { mapSaleFeedItem } from "./recentSales";

describe("mapSaleFeedItem", () =>
{
  it("маппит строку ленты: статус enum → строка, дата → Date", () =>
  {
    const sale = mapSaleFeedItem(
      {
        id: "s1",
        client: "ООО Ромашка",
        manager: "Иван Иванов",
        date: "2026-09-23T14:32:00Z",
        itemsCount: 2,
        status: 1,
        revenue: 25000,
        gp: 10000,
      },
      0,
    );

    expect(sale.id).toBe("s1");
    expect(sale.client).toBe("ООО Ромашка");
    expect(sale.manager).toBe("Иван Иванов");
    expect(sale.date.toISOString()).toBe("2026-09-23T14:32:00.000Z");
    expect(sale.itemsCount).toBe(2);
    expect(sale.status).toBe("paid");
    expect(sale.revenue).toBe(25000);
    expect(sale.gp).toBe(10000);
  });

  it("gp null у refunded проходит как null", () =>
  {
    const sale = mapSaleFeedItem(
      {
        id: "s2",
        client: "ИП Петров",
        manager: "Мария Смирнова",
        date: "2026-09-23T10:00:00Z",
        itemsCount: 1,
        status: 2,
        revenue: 5000,
        gp: null,
      },
      0,
    );

    expect(sale.status).toBe("refunded");
    expect(sale.gp).toBeNull();
  });

  it("бросает ParseError на невалидной дате — индекс в сообщении", () =>
  {
    expect(() =>
      mapSaleFeedItem(
        {
          id: "s1",
          client: "A",
          manager: "B",
          date: "не дата",
          itemsCount: 1,
          status: 1,
          revenue: 1,
          gp: null,
        },
        3,
      ),
    ).toThrow(/recentSales\[3\]\.date/);
  });
});