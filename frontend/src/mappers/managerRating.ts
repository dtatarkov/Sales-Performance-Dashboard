import type {
  ManagerRatingDto,
  ManagerRatingItemDto,
} from "../types/dto";
import type {
  ManagerRatingData,
  ManagerRatingItem,
} from "../types/dashboard";
import { parseNullableNumber, parseNumber } from "../parsers/parseNumber";
import { mapContribution } from "./contribution";
import { mapDelta } from "./delta";
import { mapDataset } from "./dataset";

/**
 * Маппинг блока 2 «Рейтинг менеджеров»; обвязка датасетов —
 * mappers/dataset.ts, блок описывает только item.
 *
 * @param raw секция managerRating DTO.
 * @returns ManagerRatingData.
 */
export function mapManagerRating(raw: ManagerRatingDto): ManagerRatingData
{
  return {
    datasets: raw.datasets.map((dataset) =>
      mapDataset(dataset, mapManagerRatingItem)),
  };
}

/**
 * Маппинг строки рейтинга менеджера; nullable-поля (margin, cancelRate)
 * проходят как есть.
 *
 * @param raw строка DTO.
 * @returns ManagerRatingItem.
 */
export function mapManagerRatingItem(
  raw: ManagerRatingItemDto,
): ManagerRatingItem
{
  return {
    id: raw.id,
    name: raw.name,
    avatar: raw.avatar,
    initials: raw.initials,
    team: raw.team,
    salesCount: parseNumber(raw.salesCount, "managerRating.salesCount"),
    revenue: parseNumber(raw.revenue, "managerRating.revenue"),
    revenueDelta: mapDelta(raw.revenueDelta, "managerRating.revenueDelta"),
    gp: parseNumber(raw.gp, "managerRating.gp"),
    gpDelta: mapDelta(raw.gpDelta, "managerRating.gpDelta"),
    ac: parseNumber(raw.ac, "managerRating.ac"),
    acDelta: mapDelta(raw.acDelta, "managerRating.acDelta"),
    margin: parseNullableNumber(raw.margin, "managerRating.margin"),
    marginDelta: mapDelta(raw.marginDelta, "managerRating.marginDelta"),
    cancelRate: parseNullableNumber(raw.cancelRate, "managerRating.cancelRate"),
    cancelRateDelta: mapDelta(
      raw.cancelRateDelta,
      "managerRating.cancelRateDelta",
    ),
    contribution: mapContribution(
      raw.contribution,
      "managerRating.contribution",
    ),
  };
}
