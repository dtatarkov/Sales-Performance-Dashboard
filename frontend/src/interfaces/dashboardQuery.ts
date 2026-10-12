import type { CustomerSegment } from "../types/customerSegment";
import type { IsoDate } from "../types/isoDate";

/**
 * Глобальные фильтры дашборда (frontend.md, раздел 4) — источник правды URL:
 * `?from=YYYY-MM-DD&to=YYYY-MM-DD&segment=...`.
 */
export type DashboardQuery = {
  /** Начало периода (календарный день, UTC). */
  from: IsoDate;
  /** Конец периода (календарный день, UTC), включительно. */
  to: IsoDate;
  /** Сегмент клиента; null — все сегменты. */
  segment: CustomerSegment | null;
};