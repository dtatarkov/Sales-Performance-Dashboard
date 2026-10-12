import { parseISO } from "date-fns";

/**
 * Парсит ISO-строку в Date в UTC.
 *
 * Строка без времени («YYYY-MM-DD») — это календарный день: парсим как
 * полночь UTC (не локальную!). Обёртка — единая точка разбора дат.
 *
 * @param value ISO 8601 строка или день YYYY-MM-DD.
 * @returns объект Date.
 */
export function parseIsoDate(value: string): Date
{
  if (value.length === 10)
  {
    const day = new Date(`${value}T00:00:00Z`);

    return day;
  }

  const moment = parseISO(value);

  return moment;
}
