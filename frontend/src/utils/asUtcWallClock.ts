/**
 * Приводит момент времени к «псевдо-дате» UTC-часов.
 *
 * Зачем: ядро date-fns не умеет форматировать в UTC (опция timeZone — из
 * пакета date-fns-tz, который мы не тянем; frontend.md, раздел 13 — только
 * date-fns). Трюк: сдвигаем момент на смещение локальной таймзоны, после чего
 * ЛОКАЛЬНЫЕ часы даты совпадают с UTC-часами оригинала.
 * Форматирование/календарные операции (startOfDay, formatISO) над псевдо-датой
 * дают UTC-результат без второй зависимости.
 *
 * @param value исходный момент времени.
 * @returns псевдо-Date для локального форматирования в UTC-виде.
 */
export function asUtcWallClock(value: Date): Date
{
  const offsetMs = value.getTimezoneOffset() * 60_000;
  const result = new Date(value.getTime() + offsetMs);

  return result;
}