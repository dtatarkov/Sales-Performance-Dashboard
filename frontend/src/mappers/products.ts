import type { ProductsDto, ProductItemDto } from "../types/dto";
import type { ProductsData, ProductItem } from "../types/dashboard";
import { parseNullableNumber, parseNumber } from "../parsers/parseNumber";
import { mapContribution } from "./contribution";
import { mapDelta } from "./delta";
import { mapDataset } from "./dataset";

/**
 * Маппинг блока 8 «Лучшие продукты»; обвязка датасетов —
 * mappers/dataset.ts, блок описывает только item.
 *
 * @param raw секция topProducts DTO.
 * @returns ProductsData.
 */
export function mapProducts(raw: ProductsDto): ProductsData
{
  return {
    datasets: raw.datasets.map((dataset) =>
      mapDataset(dataset, mapProductItem)),
  };
}

/**
 * Маппинг строки продукта; отрицательная ВП печатается как есть (ui.md),
 * nullable-поля (margin, refundRate) проходят как есть.
 *
 * @param raw строка DTO.
 * @returns ProductItem app-типа.
 */
export function mapProductItem(raw: ProductItemDto): ProductItem
{
  return {
    id: raw.id,
    name: raw.name,
    sku: raw.sku,
    category: raw.category,
    revenue: parseNumber(raw.revenue, "topProducts.revenue"),
    revenueDelta: mapDelta(raw.revenueDelta, "topProducts.revenueDelta"),
    gp: parseNumber(raw.gp, "topProducts.gp"),
    gpDelta: mapDelta(raw.gpDelta, "topProducts.gpDelta"),
    units: parseNumber(raw.units, "topProducts.units"),
    unitsDelta: mapDelta(raw.unitsDelta, "topProducts.unitsDelta"),
    margin: parseNullableNumber(raw.margin, "topProducts.margin"),
    marginDelta: mapDelta(raw.marginDelta, "topProducts.marginDelta"),
    refundRate: parseNullableNumber(raw.refundRate, "topProducts.refundRate"),
    refundRateDelta: mapDelta(
      raw.refundRateDelta,
      "topProducts.refundRateDelta",
    ),
    contribution: mapContribution(raw.contribution, "topProducts.contribution"),
  };
}
