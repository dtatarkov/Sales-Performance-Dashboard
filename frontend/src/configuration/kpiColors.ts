/**
 * Цвет KPI-серии (ui.md, блок 1). Раньше — отдельная палитра из 6 токенов;
 * теперь цвет берётся из единой палитры приложения (configuration/colorPalette.ts).
 */

import { paletteColorOf } from "./colorPalette";

/**
 * Цвет sparkline по номеру KPI-серии. Номер 1-based — совпадает с порядком
 * карточки; вне диапазона цвет крутится по кругу (палитра закольцована).
 *
 * @param colorIndex номер цвета (1-based).
 * @returns CSS-цвет серии.
 */
export function kpiColorOf(colorIndex: number): string
{
  const shiftedIndex = colorIndex - 1;

  const color = paletteColorOf(shiftedIndex);

  return color;
}
