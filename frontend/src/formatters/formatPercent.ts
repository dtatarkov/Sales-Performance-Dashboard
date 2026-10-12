import { MISSING_VALUE_MARKER } from "../configuration/missingValueMarker";

/**
 * Форматирует проценты: запятая — десятичный разделитель, `%` в суффиксе
 * (docs/archive/dashboard.html, fmtPct; docs/archive/ui.md, «Сквозные правила»).
 *
 * @param value процентное значение; null — «неопределено».
 * @param digits число знаков после запятой (по умолчанию 1).
 * @returns «26,2%» или «—» для null.
 */
export function formatPercent(value: number | null, digits = 1): string
{
  if (value === null)
  {
    return MISSING_VALUE_MARKER;
  }

  const formatted = value.toFixed(digits).replace(".", ",");

  return `${formatted}%`;
}