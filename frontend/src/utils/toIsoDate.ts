import type { IsoDate } from "../types/isoDate";

/**
 * Валидирует строку дня YYYY-MM-DD и возвращает её как IsoDate.
 *
 * Проверки: формат (ровно YYYY-MM-DD) и реальный календарный день —
 * 2026-02-30 и 2026-13-01 невалидны (round-trip через Date). Единственный
 * конструктор бренда IsoDate: тип обязан гарантировать корректность строки
 * на границах слоёв (frontend.md, раздел 4).
 *
 * @param value сырое значение (параметр URL и т.п.).
 * @returns IsoDate или null — значение не день YYYY-MM-DD.
 */
export function toIsoDate(value: string): IsoDate | null
{
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
  {
    return null;
  }

  // Суффикс Z фиксирует разбор в UTC, toISOString() сериализует UTC —
  // локальная таймзона в round-trip не участвует.
  const date = new Date(`${value}T00:00:00Z`);
  const time = date.getTime();

  // Выход за диапазон календаря (2026-13-01) — Invalid Date, toISOString()
  // на нём бросает RangeError; отсеиваем до round-trip.
  if (Number.isNaN(time))
  {
    return null;
  }

  // Переполнение дня (2026-02-30) парсер перекатывает на соседний месяц —
  // ловим несовпадением обратной сериализации.
  const roundTrip = date.toISOString().slice(0, 10);

  return roundTrip === value ? (value as IsoDate) : null;
}
