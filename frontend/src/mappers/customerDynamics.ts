import type {
  CustomerDynamicsDto,
  CustomerDynamicsItemDto,
} from "../types/dto";
import type {
  CustomerDynamicsData,
  CustomerDynamicsItem,
} from "../types/dashboard";
import { parseNumber } from "../parsers/parseNumber";
import { mapDelta } from "./delta";
import { mapDataset } from "./dataset";

/**
 * Маппинг блока 5 «Динамика клиентов»: сервер отдаёт готовые секции
 * «Рост»/«Падение» — те же датасеты метрик, внутри каждого готовый топ-5 по
 * абсолютной Δ (ui.md §5). Маппер только валидирует числа, без нарезки и
 * сортировки.
 *
 * @param raw секция customerDynamics DTO.
 * @returns CustomerDynamicsData.
 */
export function mapCustomerDynamics(
  raw: CustomerDynamicsDto,
): CustomerDynamicsData
{
  return {
    growth: raw.growth.map((dataset) => mapDataset(dataset, mapCustomerDynamicsItem)),
    decline: raw.decline.map((dataset) => mapDataset(dataset, mapCustomerDynamicsItem)),
  };
}

/**
 * Маппинг строки секции динамики: valueNormalized DTO → valueNormalized
 * app-типа (длина бара, 0–100).
 *
 * @param raw строка DTO.
 * @returns CustomerDynamicsItem.
 */
export function mapCustomerDynamicsItem(
  raw: CustomerDynamicsItemDto,
): CustomerDynamicsItem
{
  return {
    id: raw.id,
    name: raw.name,
    valueNormalized: parseNumber(
      raw.valueNormalized,
      "customerDynamics.valueNormalized",
    ),
    absoluteDelta: parseNumber(raw.absoluteDelta, "customerDynamics.absoluteDelta"),
    delta: mapDelta(raw.delta, "customerDynamics.delta"),
  };
}
