/**
 * Осветление hex-цвета (без #): каждый канал смешивается с белым в заданной
 * пропорции — tint, а не opacity (opacity просвечивает фон карточки).
 */
export type HexColor = string;

/**
 * Разбирает hex-строку «RRGGBB» (без #) в каналы [r, g, b] 0–255.
 *
 * @param hex hex-строка без решётки, ровно 6 шестнадцатеричных цифр.
 * @returns каналы цвета.
 */
function channelsOf(hex: HexColor): [number, number, number]
{
  const red = parseInt(hex.slice(0, 2), 16);
  const green = parseInt(hex.slice(2, 4), 16);
  const blue = parseInt(hex.slice(4, 6), 16);

  return [red, green, blue];
}

/**
 * Осветляет hex-цвет на заданный процент: смешивание с белым
 * (канал → канал + (255 − канал) × percents/100). Границы процента —
 * 0–100: 0 — цвет без изменений, 100 — белый. Ожидает формат «#RRGGBB»
 * (палитра configuration/colorPalette — 6-значный hex).
 *
 * @param value цвет «#RRGGBB».
 * @param percents процент осветления, 0–100.
 * @returns осветлённый цвет «#RRGGBB».
 */
export function lighten(value: string, percents: number): string
{
  const withoutHash = value.replace("#", "");
  const [red, green, blue] = channelsOf(withoutHash);

  const ratio = Math.min(Math.max(percents, 0), 100) / 100;

  const mixedRed = Math.round(red + (255 - red) * ratio);
  const mixedGreen = Math.round(green + (255 - green) * ratio);
  const mixedBlue = Math.round(blue + (255 - blue) * ratio);

  const result = `#${[
    mixedRed.toString(16).padStart(2, "0"),
    mixedGreen.toString(16).padStart(2, "0"),
    mixedBlue.toString(16).padStart(2, "0"),
  ].join("")}`;

  return result;
}
