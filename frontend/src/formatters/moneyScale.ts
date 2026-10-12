import { trimTrailingZeros } from "../utils/trimTrailingZeros";

/**
 * Масштаб денежных значений набора: единица выбирается один раз по
 * максимуму, чтобы все значения набора (ось X, tooltip) читались в одной
 * единице — без скачков «999 тыс» → «1 млн» на соседних делениях
 * (ui.md, «Сквозные правила отображения чисел»).
 */
export type MoneyScale = {
  /** Делитель для перевода рублей в выбранную единицу. */
  divisor: number;
  /** Подпись единицы: «₽», «тыс ₽» или «млн ₽». */
  unit: string;
  /** Число знаков после запятой при показе. */
  fractionDigits: number;
};

/**
 * Подбирает масштаб денежного набора по максимальному значению:
 * ≥ 1 млн → «млн ₽» (одна десятичная), ≥ 1 тыс → «тыс ₽» (целые),
 * иначе → «₽» (целые).
 *
 * @param max максимальное значение набора в рублях.
 * @returns масштаб набора.
 */
export function moneyScaleOf(max: number): MoneyScale
{
  const magnitude = Math.abs(max);

  if (magnitude >= 1_000_000)
  {
    return { divisor: 1_000_000, unit: "млн ₽", fractionDigits: 1 };
  }

  if (magnitude >= 1_000)
  {
    return { divisor: 1_000, unit: "тыс ₽", fractionDigits: 0 };
  }

  return { divisor: 1, unit: "₽", fractionDigits: 0 };
}

/**
 * Форматирует денежное значение в единице масштаба как число без подписи
 * единицы: делит на делитель, округляет до заданных знаков, приводит запятую
 * к десятичному разделителю и отбрасывает хвостовые нули. Отрицательное —
 * U+2212 (ui.md). Предназначено для тиков оси X, где единица подписана
 * отдельно (docs/archive/ui.md, блок 3; макет docs/archive/dashboard.html — renderComparison).
 *
 * @param value значение в рублях.
 * @param scale масштаб набора (moneyScaleOf).
 * @returns строка вида «1,5», «350» или «0».
 */
export function formatScaledMoneyAmount(value: number, scale: MoneyScale): string
{
  const sign = value < 0 ? "\u2212" : "";
  const scaled = Math.abs(value) / scale.divisor;

  const fixed = scaled.toFixed(scale.fractionDigits).replace(".", ",");

  // trimTrailingZeros рассчитан на записи с дробной частью («1,50»); целое
  // значение (fractionDigits = 0, «1000») без запятой обрезать нельзя —
  // срезались бы значащие нули.
  const trimmed = fixed.includes(",")
    ? trimTrailingZeros(fixed)
    : fixed;

  return `${sign}${trimmed}`;
}

/**
 * Форматирует денежное значение в единице масштаба с подписью единицы —
 * через formatScaledMoneyAmount (единая запись числа для тиков и tooltip).
 *
 * @param value значение в рублях.
 * @param scale масштаб набора (moneyScaleOf).
 * @returns строка вида «1,5 млн ₽», «350 тыс ₽» или «0 ₽».
 */
export function formatScaledMoney(value: number, scale: MoneyScale): string
{
  const amount = formatScaledMoneyAmount(value, scale);

  return `${amount} ${scale.unit}`;
}
