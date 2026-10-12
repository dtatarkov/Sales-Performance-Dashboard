import { trimTrailingZeros } from "../utils/trimTrailingZeros";

/**
 * Форматирует денежное значение для показа: адаптация правила макета
 * (docs/archive/dashboard.html, fmtMoney; docs/archive/ui.md, «Сквозные правила отображения чисел»).
 *
 * - 0 → «0 ₽» (реальный ноль, не «—»; ui.md);
 * - отрицательное → U+2212 (математический минус, не дефис; ui.md);
 * - |v| ≥ 1 млн → «X,XX млн ₽» (запятая — десятичный разделитель, нули отброшены);
 * - |v| ≥ 1 тыс → «X тыс ₽» (округление до целого, как в макете);
 * - иначе → «X ₽».
 *
 * @param value денежное значение в рублях.
 * @returns строка для отображения.
 */
export function formatMoney(value: number): string
{
  if (value === 0)
  {
    return "0 ₽";
  }

  const sign = value < 0 ? "\u2212" : "";
  const magnitude = Math.abs(value);

  if (magnitude >= 1_000_000)
  {
    const millions = magnitude / 1_000_000;
    const withComma = millions.toFixed(2).replace(".", ",");
    const trimmed = trimTrailingZeros(withComma);

    return `${sign}${trimmed} млн ₽`;
  }

  if (magnitude >= 1_000)
  {
    const thousands = Math.round(magnitude / 1_000);

    return `${sign}${thousands} тыс ₽`;
  }

  return `${sign}${magnitude} ₽`;
}
