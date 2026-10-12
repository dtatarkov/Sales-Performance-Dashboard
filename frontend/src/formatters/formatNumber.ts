import { MISSING_VALUE_MARKER } from "../configuration/missingValueMarker";

/**
 * Форматирует число без единиц (штуки, счётчики): разделители тысяч по
 * русской локали, null — «—» (ui.md, «Сквозные правила отображения чисел»).
 *
 * @param value целое число; null — «неопределено».
 * @returns «12 345» или «—» для null.
 */
export function formatNumber(value: number | null): string
{
  if (value === null)
  {
    return MISSING_VALUE_MARKER;
  }

  const result = value.toLocaleString("ru-RU");

  return result;
}