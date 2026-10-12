import { parseIsoDate } from "../parsers/parseIsoDate";
import type { IsoDate } from "../types/isoDate";
import type { UtcRange } from "../types/utcRange";

/** Длительность суток в миллисекундах. */
const DAY_MS = 86_400_000;

/**
 * Раскрывает границы календарных дней в UTC-полуинтервал [from, to):
 * from → 00:00:00Z, to → (to + 1 день) 00:00:00Z.
 *
 * Верхняя граница исключается — см. domain.md, «Активный период»;
 * frontend.md, раздел 4 (раскрытие границ — чистая функция utils).
 *
 * @param from начальный календарный день (YYYY-MM-DD).
 * @param to конечный календарный день (YYYY-MM-DD), включительно.
 * @returns UTC-границы периода для тела запроса api.md.
 */
export function expandDayBoundaries(from: IsoDate, to: IsoDate): UtcRange
{
  const fromUtc = parseIsoDate(from);
  const toUtc = new Date(parseIsoDate(to).getTime() + DAY_MS);

  return { fromUtc, toUtc };
}