/**
 * Словари числовых enum'ов api.md → строковых union'ов ui.md
 * (frontend.md, раздел 8). Единственное место, где числа enum'ов известны:
 * вне api числовые значения не используются.
 */

import type { ContributionUnit } from "../types/contribution";
import type { CustomerSegment } from "../types/customerSegment";
import type { DeltaUnit } from "../types/delta";
import type { SaleStatus } from "../types/saleStatus";
import type { SegmentDto } from "../types/dto";
import { parseEnum } from "../parsers/parseEnum";

/** Словарь Segment: 1 Enterprise, 2 Mid-market, 3 SMB (api.md). */
const SEGMENT_DICTIONARY: Readonly<Record<number, CustomerSegment>> = {
  1: "enterprise",
  2: "mid-market",
  3: "smb",
};

/** Обратный словарь Segment: строковый CustomerSegment → число DTO. */
const SEGMENT_TO_DTO: Readonly<Record<CustomerSegment, SegmentDto>> = {
  enterprise: 1,
  "mid-market": 2,
  smb: 3,
};

/** Словарь DeltaUnit: 1 percent, 2 pp (api.md). */
const DELTA_UNIT_DICTIONARY: Readonly<Record<number, DeltaUnit>> = {
  1: "percent",
  2: "pp",
};

/** Словарь ContributionUnit: 1 gp, 2 revenue, 3 units, 4 ac (api.md). */
const CONTRIBUTION_UNIT_DICTIONARY: Readonly<Record<number, ContributionUnit>> = {
  1: "gp",
  2: "revenue",
  3: "units",
  4: "ac",
};

/** Словарь SaleStatus: 1 paid, 2 refunded, 3 cancelled (api.md). */
const SALE_STATUS_DICTIONARY: Readonly<Record<number, SaleStatus>> = {
  1: "paid",
  2: "refunded",
  3: "cancelled",
};

/**
 * Маппит числовой Segment в строковый CustomerSegment.
 *
 * @param raw число из DTO (1–3).
 * @returns строковое значение сегмента.
 * @throws ParseError при неизвестном значении.
 */
export function mapSegment(raw: number): CustomerSegment
{
  return parseEnum(raw, "Segment", SEGMENT_DICTIONARY);
}

/**
 * Маппит строковый CustomerSegment в числовой enum DTO — обратный словарю
 * api.md (тело POST-запроса, services/dashboardService.ts).
 *
 * @param segment сегмент или null (все сегменты).
 * @returns число 1–3 или null.
 */
export function mapSegmentToDto(
  segment: CustomerSegment | null,
): SegmentDto | null
{
  if (segment === null)
  {
    return null;
  }

  return SEGMENT_TO_DTO[segment];
}

/**
 * Маппит числовой DeltaUnit в строковый DeltaUnit.
 *
 * @param raw число из DTO (1–2).
 * @returns «percent» или «pp».
 * @throws ParseError при неизвестном значении.
 */
export function mapDeltaUnit(raw: number): DeltaUnit
{
  return parseEnum(raw, "DeltaUnit", DELTA_UNIT_DICTIONARY);
}

/**
 * Маппит числовой ContributionUnit в строковый ContributionUnit.
 *
 * @param raw число из DTO (1–4).
 * @returns строковое значение единицы вклада.
 * @throws ParseError при неизвестном значении.
 */
export function mapContributionUnit(raw: number): ContributionUnit
{
  return parseEnum(raw, "ContributionUnit", CONTRIBUTION_UNIT_DICTIONARY);
}

/**
 * Маппит числовой SaleStatus в строковый SaleStatus.
 *
 * @param raw число из DTO (1–3).
 * @returns строковое значение статуса сделки.
 * @throws ParseError при неизвестном значении.
 */
export function mapSaleStatus(raw: number): SaleStatus
{
  return parseEnum(raw, "SaleStatus", SALE_STATUS_DICTIONARY);
}