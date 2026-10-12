import type { CustomerTopDto, CustomerTopItemDto } from "../types/dto";
import type {
  CustomerTopData,
  CustomerTopItem,
} from "../types/dashboard";
import { parseNullableNumber, parseNumber } from "../parsers/parseNumber";
import { mapContribution } from "./contribution";
import { mapDelta } from "./delta";
import { mapDataset } from "./dataset";

/**
 * Маппинг блока 4 «Клиенты — Топ-10»; обвязка датасетов —
 * mappers/dataset.ts, блок описывает только item.
 *
 * @param raw секция topCustomers DTO.
 * @returns CustomerTopData.
 */
export function mapCustomerTop(raw: CustomerTopDto): CustomerTopData
{
  return {
    datasets: raw.datasets.map((dataset) =>
      mapDataset(dataset, mapCustomerTopItem)),
  };
}

/**
 * Маппинг строки топ-клиентов; nullable-поля (margin, refundRate,
 * cancelRate) проходят как есть.
 *
 * @param raw строка DTO.
 * @returns CustomerTopItem.
 */
export function mapCustomerTopItem(raw: CustomerTopItemDto): CustomerTopItem
{
  return {
    id: raw.id,
    name: raw.name,
    since: parseNumber(raw.since, "topCustomers.since"),
    orderCount: parseNumber(raw.orderCount, "topCustomers.orderCount"),
    revenue: parseNumber(raw.revenue, "topCustomers.revenue"),
    revenueDelta: mapDelta(raw.revenueDelta, "topCustomers.revenueDelta"),
    gp: parseNumber(raw.gp, "topCustomers.gp"),
    gpDelta: mapDelta(raw.gpDelta, "topCustomers.gpDelta"),
    ac: parseNumber(raw.ac, "topCustomers.ac"),
    acDelta: mapDelta(raw.acDelta, "topCustomers.acDelta"),
    margin: parseNullableNumber(raw.margin, "topCustomers.margin"),
    marginDelta: mapDelta(raw.marginDelta, "topCustomers.marginDelta"),
    refundRate: parseNullableNumber(raw.refundRate, "topCustomers.refundRate"),
    refundRateDelta: mapDelta(
      raw.refundRateDelta,
      "topCustomers.refundRateDelta",
    ),
    cancelRate: parseNullableNumber(raw.cancelRate, "topCustomers.cancelRate"),
    cancelRateDelta: mapDelta(
      raw.cancelRateDelta,
      "topCustomers.cancelRateDelta",
    ),
    contribution: mapContribution(raw.contribution, "topCustomers.contribution"),
  };
}
