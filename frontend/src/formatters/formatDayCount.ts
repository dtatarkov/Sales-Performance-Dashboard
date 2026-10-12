import { plural } from "../utils/plural";

/**
 * Подпись длительности периода в днях: «7 дней», «1 день», «23 дня»
 * (ui.md, тулбар: вторая строка подписи диапазона).
 *
 * @param dayCount число календарных дней периода.
 * @returns строка с числом и согласованным словом «день/дня/дней».
 */
export function formatDayCount(dayCount: number): string
{
  const formattedCount = dayCount.toLocaleString("ru-RU");
  const dayWord = plural(dayCount, "день", "дня", "дней");

  const label = `${formattedCount} ${dayWord}`;

  return label;
}