/**
 * Пресеты периода тулбара (ui.md, «Период»).
 * «Произвольный период» — отдельный режим (from/to), пресетом не является.
 */
export type PeriodPresetType =
  | "today"
  | "7d"
  | "30d"
  | "this-month"
  | "last-month";