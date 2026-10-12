import type { IsoDate } from "../types/isoDate";
import { toIsoDate } from "../utils/toIsoDate";
import { FormatError } from "../errors/formatError";

/**
 * Форматирует календарные компоненты даты в строку дня YYYY-MM-DD
 * (ui.md, подписи диапазона; frontend.md, раздел 4).
 *
 * Локальные геттеры (getFullYear и т.д.) читают календарные компоненты,
 * которые у псевдо-Date (asUtcWallClock) совпадают с UTC. День собирается
 * из компонентов реальной Date, поэтому всегда валиден — toIsoDate здесь
 * лишь проводит строку через конструктор бренда IsoDate, ветка FormatError
 * недостижима (баг-детектор).
 *
 * @param value дата, чьи календарные компоненты форматируются.
 * @returns строка дня, тип IsoDate.
 * @throws FormatError если из компонентов даты получился невалидный день.
 */
export function formatToIsoDate(value: Date): IsoDate
{
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");

  const isoDay = toIsoDate(`${year}-${month}-${day}`);

  if (isoDay === null)
  {
    throw new FormatError(
      "formatToIsoDate",
      `Из даты «${value.toISOString()}» получен невалидный день`,
    );
  }

  return isoDay;
}
