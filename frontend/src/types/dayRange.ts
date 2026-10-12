import type { IsoDate } from "./isoDate";

/**
 * Диапазон календарных дней (оба конца включительно) — результат вычисления
 * пресетов (resolvePresetRange) и выбор в DateRangePicker. Раскрытие в
 * полуинтервал [from, to) выполняет expandDayBoundaries.
 */
export type DayRange = {
  /** Начальный календарный день (YYYY-MM-DD). */
  from: IsoDate;
  /** Конечный календарный день (YYYY-MM-DD), включительно. */
  to: IsoDate;
};