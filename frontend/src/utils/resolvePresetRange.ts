import
{
  addDays,
  endOfMonth,
  startOfMonth,
  subMonths,
} from "date-fns";
import { asUtcWallClock } from "./asUtcWallClock";
import { formatToIsoDate } from "../formatters/formatToIsoDate";
import type { DayRange } from "../types/dayRange";
import type { PeriodPresetType } from "../types/periodPresetType";

/**
 * Вычисляет диапазон календарных дней по пресету тулбара (ui.md, «Период»).
 * Пресеты считаются в UTC (frontend.md, раздел 4); результат — дни для URL
 * и подписи диапазона; раскрытие в полуинтервал [from, to) выполняет
 * expandDayBoundaries.
 *
 * «today» — день момента now; «7d»/«30d» — окно, завершающееся сегодня
 * (7/30 календарных дней, сегодня включительно);
 * «this-month» — с 1-го числа текущего месяца по today;
 * «last-month» — полный предыдущий календарный месяц.
 *
 * @param preset пресет тулбара.
 * @param now фиксированный момент расчёта (тесты передают известное время).
 * @returns границы периода в календарных днях (включительно).
 */
export function resolvePresetRange(
  preset: PeriodPresetType,
  now: Date,
): DayRange
{
  const today = asUtcWallClock(now);

  if (preset === "today")
  {
    return { from: formatToIsoDate(today), to: formatToIsoDate(today) };
  }

  if (preset === "7d")
  {
    return {
      from: formatToIsoDate(addDays(today, -6)),
      to: formatToIsoDate(today),
    };
  }

  if (preset === "30d")
  {
    return {
      from: formatToIsoDate(addDays(today, -29)),
      to: formatToIsoDate(today),
    };
  }

  if (preset === "this-month")
  {
    return {
      from: formatToIsoDate(startOfMonth(today)),
      to: formatToIsoDate(today),
    };
  }

  // Полный предыдущий месяц: 1-е число прошлого месяца — последний день
  // прошлого месяца (endOfMonth даёт конец месяца независимо от длины).
  const lastMonth = subMonths(today, 1);

  const result = {
    from: formatToIsoDate(startOfMonth(lastMonth)),
    to: formatToIsoDate(endOfMonth(lastMonth)),
  };

  return result;
}