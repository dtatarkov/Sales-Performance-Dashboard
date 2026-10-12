import type { RecentSalesDto, SaleFeedItemDto } from "../types/dto";
import type {
  RecentSalesData,
  SaleFeedItem,
} from "../types/dashboard";
import { parseDate } from "../parsers/parseDate";
import { parseNullableNumber, parseNumber } from "../parsers/parseNumber";
import { mapSaleStatus } from "./enumMappers";

/**
 * Маппинг блока 9 «Последние продажи»; gp null для refunded/cancelled.
 *
 * @param raw секция recentSales DTO.
 * @returns RecentSalesData.
 */
export function mapRecentSales(raw: RecentSalesDto): RecentSalesData {
  return {
    sales: raw.sales.map((sale, index) => mapSaleFeedItem(sale, index)),
  };
}

/**
 * Маппинг строки ленты сделок: статус — числовой enum → строковый union.
 *
 * @param raw сделка DTO.
 * @param index индекс для сообщений парсеров.
 * @returns SaleFeedItem.
 */
export function mapSaleFeedItem(
  raw: SaleFeedItemDto,
  index: number,
): SaleFeedItem {
  const rawStatus = parseNumber(raw.status, `recentSales[${index}].status`);

  return {
    id: raw.id,
    client: raw.client,
    manager: raw.manager,
    date: parseDate(raw.date, `recentSales[${index}].date`),
    itemsCount: parseNumber(raw.itemsCount, `recentSales[${index}].itemsCount`),
    status: mapSaleStatus(rawStatus),
    revenue: parseNumber(raw.revenue, `recentSales[${index}].revenue`),
    gp: parseNullableNumber(raw.gp, `recentSales[${index}].gp`),
  };
}
