import type {
  ManagerComparisonDto,
  ManagerComparisonItemDto,
} from "../types/dto";
import type {
  ManagerComparisonData,
  ManagerComparisonItem,
} from "../types/dashboard";
import { parseNumber } from "../parsers/parseNumber";
import { mapDelta } from "./delta";
import { mapDataset } from "./dataset";

/**
 * Маппинг блока 3 «Сравнение менеджеров»; обвязка датасетов —
 * mappers/dataset.ts, блок описывает только item.
 *
 * @param raw секция managerComparison DTO.
 * @returns ManagerComparisonData.
 */
export function mapManagerComparison(
  raw: ManagerComparisonDto,
): ManagerComparisonData
{
  return {
    datasets: raw.datasets.map((dataset) =>
      mapDataset(dataset, mapManagerComparisonItem)),
  };
}

/**
 * Маппинг строки сравнения менеджеров; Δ nullable — null остаётся null.
 *
 * @param raw строка DTO.
 * @returns ManagerComparisonItem.
 */
export function mapManagerComparisonItem(
  raw: ManagerComparisonItemDto,
): ManagerComparisonItem
{
  return {
    id: raw.id,
    name: raw.name,
    team: raw.team,
    value: parseNumber(raw.value, "managerComparison.value"),
    delta: mapDelta(raw.delta, "managerComparison.delta"),
  };
}
