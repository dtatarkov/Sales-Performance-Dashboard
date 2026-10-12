/**
 * Русская плюрализация количества — адаптация plural() макета
 * (docs/archive/dashboard.html): «1 продажа / 2 продажи / 5 продаж».
 *
 * @param count количество.
 * @param one форма для 1 (и 21, 31…).
 * @param few форма для 2–4 (и 22–24…).
 * @param many форма для 0 и 5–20.
 * @returns подходящая форма слова.
 */
export function plural(
  count: number,
  one: string,
  few: string,
  many: string,
): string {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  if (lastDigit === 1 && lastTwoDigits !== 11) {
    return one;
  }

  if (lastDigit >= 2 && lastDigit <= 4 && !(lastTwoDigits >= 12 && lastTwoDigits <= 14)) {
    return few;
  }

  return many;
}