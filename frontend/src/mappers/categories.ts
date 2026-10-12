import type {
  CategoriesDto,
  CategoryDatasetDto,
  CategoryItemDto,
} from "../types/dto";
import type {
  CategoriesData,
  CategoryDataset,
  CategoryItem,
} from "../types/dashboard";
import { parseNullableNumber, parseNumber } from "../parsers/parseNumber";
import { mapDelta } from "./delta";
import { mapDataset } from "./dataset";

/**
 * Маппинг блока 7 «Продажи по категориям»: датасеты с total; обвязка
 * датасетов — mappers/dataset.ts, блок описывает только item.
 *
 * @param raw секция categories DTO.
 * @returns CategoriesData.
 */
export function mapCategories(raw: CategoriesDto): CategoriesData
{
  return {
    datasets: raw.datasets.map((dataset) =>
      mapCategoryDataset(dataset, mapCategoryItem)),
  };
}

/**
 * Маппинг датасета категорий (CategoryDatasetDto = DatasetDto + total):
 * общая обвязка mapDataset, плюс total для центра доната. Специфика
 * этого блока — total есть только у категорий.
 *
 * @param dataset датасет категорий DTO.
 * @param mapItem маппер одной строки: raw → app-тип.
 * @returns CategoryDataset app-типа.
 */
export function mapCategoryDataset<TItem>(
  dataset: CategoryDatasetDto<CategoryItemDto>,
  mapItem: (raw: CategoryItemDto) => TItem,
): CategoryDataset<TItem>
{
  const base = mapDataset(dataset, mapItem);
  const total = parseNumber(dataset.total, "categories.total");

  return {
    name: base.name,
    total,
    items: base.items,
  };
}

/**
 * Маппинг строки категории; margin nullable — null остаётся null.
 *
 * @param raw строка DTO.
 * @returns CategoryItem.
 */
export function mapCategoryItem(raw: CategoryItemDto): CategoryItem
{
  return {
    id: raw.id,
    name: raw.name,
    revenue: parseNumber(raw.revenue, "categories.revenue"),
    revenueDelta: mapDelta(raw.revenueDelta, "categories.revenueDelta"),
    gp: parseNumber(raw.gp, "categories.gp"),
    gpDelta: mapDelta(raw.gpDelta, "categories.gpDelta"),
    margin: parseNullableNumber(raw.margin, "categories.margin"),
    marginDelta: mapDelta(raw.marginDelta, "categories.marginDelta"),
    salesCount: parseNumber(raw.salesCount, "categories.salesCount"),
    salesCountDelta: mapDelta(
      raw.salesCountDelta,
      "categories.salesCountDelta",
    ),
    share: parseNumber(raw.share, "categories.share"),
  };
}
