import type { IsoDate } from "../types/isoDate";

/**
 * Парсит день YYYY-MM-DD в локальную календарную полуночь.
 *
 * Инверсия formatToIsoDate: компоненты строки собираются в Date локальными
 * конструкторами — календарный день строки совпадает с календарным днём
 * Date в любой таймзоне. Для UI, работающего в локальных датах (DayPicker),
 * в отличие от parseIsoDate (полночь UTC — для интервалов запроса).
 *
 * @param value день YYYY-MM-DD (тип IsoDate — строка уже валидна).
 * @returns локальная полночь этого календарного дня.
 */
export function parseIsoDateToLocal(value: IsoDate): Date
{
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));

  const localMidnight = new Date(year, month - 1, day);

  return localMidnight;
}
