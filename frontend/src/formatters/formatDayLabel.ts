import type { IsoDate } from "../types/isoDate";

/** Русские месяцы в родительном падеже для подписи дня. */
const MONTH_NAMES_GENITIVE = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
] as const;

/**
 * Форматирует календарный день YYYY-MM-DD в подпись «17 сентября 2026»
 * (ui.md, вторая строка тулбара).
 *
 * Разбор строки вручную (split, не Date-парсинг): строка дня — календарная
 * дата без времени, и она не должна зависеть от таймзоны среды выполнения.
 *
 * @param day календарный день.
 * @returns подпись дня: число, месяц в родительном падеже, год.
 */
export function formatDayLabel(day: IsoDate): string
{
  const [year, month, date] = day.split("-").map(Number);
  const result = `${date} ${MONTH_NAMES_GENITIVE[month - 1]} ${year}`;

  return result;
}
