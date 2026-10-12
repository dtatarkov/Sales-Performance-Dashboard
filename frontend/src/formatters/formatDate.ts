import { format as formatDateFns } from "date-fns";
import { ru } from "date-fns/locale";
import { asUtcWallClock } from "../utils/asUtcWallClock";

/** Формат подписи дат тулбара/графиков: «17 сент 2026». */
const DATE_FORMAT = "d MMM yyyy";

/** Формат подписи времени в ленте продаж: «23.09 14:32». */
const DATETIME_FORMAT = "dd.MM HH:mm";

/** Формат подписи оси X графиков: «17 сент». */
const SHORT_DATE_FORMAT = "d MMM";

/** Русская локаль подписей дат. */
const FORMAT_OPTIONS = { locale: ru };

/**
 * Форматирует дату для подписи диапазона тулбара: «17 сент 2026».
 *
 * Вход предварительно переводится в UTC-часы (asUtcWallClock):
 * ядро date-fns не умеет форматировать в UTC, а данные дашборда — UTC
 * по контракту (api.md); локальная таймзона не должна смещать подписи дней.
 *
 * @param value дата.
 * @returns строка по-русски.
 */
export function formatDate(value: Date): string
{
  const wallClock = asUtcWallClock(value);
  const formatted = formatDateFns(wallClock, DATE_FORMAT, FORMAT_OPTIONS);

  return formatted;
}

/**
 * Форматирует дату с временем для ленты продаж: «23.09 14:32» (UTC-часы).
 *
 * @param value момент времени (UTC).
 * @returns строка «dd.MM HH:mm».
 */
export function formatDateTime(value: Date): string
{
  const wallClock = asUtcWallClock(value);
  const formatted = formatDateFns(wallClock, DATETIME_FORMAT, FORMAT_OPTIONS);

  return formatted;
}

/**
 * Форматирует дату коротко для оси X графиков: «17 сент» (UTC-часы).
 *
 * @param value дата.
 * @returns строка без года.
 */
export function formatDateShort(value: Date): string
{
  const wallClock = asUtcWallClock(value);
  const formatted = formatDateFns(wallClock, SHORT_DATE_FORMAT, FORMAT_OPTIONS);

  return formatted;
}

/** Формат подписи часа на оси X почасовых серий: «05:00». */
const SHORT_TIME_FORMAT = "HH:00";

/**
 * Форматирует час для оси X почасовых серий: «05:00» (UTC-часы).
 *
 * Серия однодневного периода (api.md, SeriesPointDto) несёт 24 часовые
 * точки — дневная подпись «17 сент» повторилась бы 24 раза.
 *
 * @param value момент — начало часового бакета.
 * @returns строка «HH:00».
 */
export function formatHourShort(value: Date): string
{
  const wallClock = asUtcWallClock(value);
  const formatted = formatDateFns(wallClock, SHORT_TIME_FORMAT, FORMAT_OPTIONS);

  return formatted;
}

/** Формат времени бакета в тултипе: «10:00». */
const RANGE_TIME_FORMAT = "HH:mm";

/**
 * Форматирует полуинтервал бакета [dateFrom, dateTo) для тултипа динамики
 * во времени (UTC-часы). Грани могут лежать в разных сутках — подпись
 * показывает день у каждой из них; внутри одних суток день пишется один раз.
 *
 * @param dateFrom начало бакета (включается).
 * @param dateTo конец бакета (не включается).
 * @param isOneDay период из одних суток — дни в подписи избыточны, только часы.
 * @returns строка вида «17 сент, 10:00 – 12:00» или «17 сент 10:00 – 18 сент 00:00».
 */
export function formatBucketRange(dateFrom: Date, dateTo: Date, isOneDay: boolean): string
{
  const fromWallClock = asUtcWallClock(dateFrom);
  const toWallClock = asUtcWallClock(dateTo);

  const fromTime = formatDateFns(fromWallClock, RANGE_TIME_FORMAT, FORMAT_OPTIONS);
  const toTime = formatDateFns(toWallClock, RANGE_TIME_FORMAT, FORMAT_OPTIONS);

  if (isOneDay)
  {
    const result = `${fromTime} – ${toTime}`;

    return result;
  }

  const fromDay = formatDateShort(dateFrom);
  const toDay = formatDateShort(dateTo);

  // Сутки границы сравниваются по исходным UTC-моментам: у псевдо-даты
  // (asUtcWallClock) собственный сдвинутый UTC — сравнение по ней ошибочно.
  const sameDay = dateFrom.toISOString().slice(0, 10) === dateTo.toISOString().slice(0, 10);

  const result = sameDay
    ? `${fromDay}, ${fromTime} – ${toTime}`
    : `${fromDay} ${fromTime} – ${toDay} ${toTime}`;

  return result;
}