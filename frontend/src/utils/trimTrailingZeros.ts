/**
 * Отрезает хвостовые нули и лишнюю запятую у строки десятичного числа
 * с запятой-разделителем: «1,50» → «1,5», «1,00» → «1», «0,00» → «0»
 * (ui.md, «Сквозные правила отображения чисел»: нули в дробной части
 * не показываются).
 *
 * @param value строка десятичного числа с запятой.
 * @returns строка без хвостовых нулей в дробной части.
 */
export function trimTrailingZeros(value: string): string
{
  const withoutTrailingZeros = value.replace(/,?0+$/, "");
  const result = withoutTrailingZeros === "" ? "0" : withoutTrailingZeros;

  return result;
}
