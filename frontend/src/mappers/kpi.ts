import type { KpiCardDto, KpiDto } from "../types/dto";
import type {
  BestManagerData,
  KpiCardData,
  KpiData,
} from "../types/dashboard";
import { parseNullableNumber, parseNumber } from "../parsers/parseNumber";
import { mapDelta } from "./delta";
import { mapSeries } from "./series";

/**
 * Маппинг блока 1 «KPI-карточки».
 *
 * @param raw секция kpi DTO.
 * @returns KpiData.
 */
export function mapKpi(raw: KpiDto): KpiData
{
  return {
    revenue: mapKpiCard(raw.revenue, "kpi.revenue"),
    gp: mapKpiCard(raw.gp, "kpi.gp"),
    margin: mapKpiCard(raw.margin, "kpi.margin"),
    salesCount: mapKpiCard(raw.salesCount, "kpi.salesCount"),
    avgCheck: mapKpiCard(raw.avgCheck, "kpi.avgCheck"),

    bestManager: raw.bestManager === null
      ? null
      : mapBestManager(raw.bestManager),
  };
}

/**
 * Маппинг карточки «Лучший менеджер» (kpi.bestManager DTO → app-тип).
 *
 * @param raw карточка DTO (не null — проверено в mapKpi).
 * @returns BestManagerData.
 */
export function mapBestManager(
  raw: NonNullable<KpiDto["bestManager"]>,
): BestManagerData
{
  return {
    name: raw.name,
    avatar: raw.avatar,
    initials: raw.initials,
    gp: parseNumber(raw.gp, "kpi.bestManager.gp"),
    salesCount: parseNumber(raw.salesCount, "kpi.bestManager.salesCount"),
    delta: mapDelta(raw.delta, "kpi.bestManager.delta"),
    series: mapSeries(raw.series, "kpi.bestManager.series"),
  };
}

/**
 * Маппинг одной KPI-карточки; value null — «не определено» → «—» на карточке.
 *
 * @param raw карточка DTO.
 * @param source имя поля для сообщений парсеров.
 * @returns KpiCardData.
 */
export function mapKpiCard(raw: KpiCardDto, source: string): KpiCardData
{
  return {
    value: parseNullableNumber(raw.value, `${source}.value`),
    delta: mapDelta(raw.delta, `${source}.delta`),
    series: mapSeries(raw.series, `${source}.series`),
  };
}
