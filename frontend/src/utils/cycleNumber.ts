/**
 * Нормализует число в диапазон 0..count-1, крутит по кругу в обе стороны:
 * cycleNumber(7, 6) → 1, cycleNumber(-2, 6) → 4. Двойной модуль — чтобы
 * отрицательные остатки JS не вылезли за границу диапазона.
 *
 * @param value любое целое число.
 * @param count длина круга (0 не допускается).
 * @returns значение 0..count-1.
 */
export function cycleNumber(value: number, count: number): number {
  const positiveRemainder = ((value % count) + count) % count;

  return positiveRemainder;
}
