/**
 * Единая палитра цветов приложения (20 оттенков). Один источник для всех
 * цветных сущностей: серий метрик, KPI-карточек, sparkline, аватаров,
 * категорий доната и точек продуктов. Значения совпадают с токенами
 * globals.css (--color-palette-1..20): CSS-переменные нужны для SVG-заливок,
 * а hex-копия — для JS-манипуляций цветом (lighten), которые не разбирают
 * var(--…). При изменении держать оба места синхронными.
 */

import { cycleNumber } from "../utils/cycleNumber";
import { lighten } from "../utils/lighten";

/** Число цветов палитры. */
const PALETTE_SIZE = 20;

/** Процент осветления для hover-вариантов палитры (lighten к белому). */
const LIGHTEN_PERCENTS = 20;

/** Hex-значения палитры — зеркало токенов globals.css (индекс 0 → палитра 1). */
const PALETTE_HEX: readonly string[] = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
  "#f97316",
  "#6b7280",
  "#d1d5db",
  "#ef4444",
  "#14b8a6",
  "#a855f7",
  "#0ea5e9",
  "#eab308",
  "#22c55e",
  "#f43f5e",
  "#6366f1",
  "#0891b2",
  "#64748b",
];

/**
 * Осветлённые варианты палитры (hover-подсветка, tint +20% к белому) —
 * прекомпьют по PALETTE_HEX: цвет активного бара должен высчитываться
 * один раз на модуль, а не на каждый рендер (AGENTS.md, «Стиль JSX»).
 * Индексация совпадает с PALETTE_HEX (0 → палитра 1).
 */
const PALETTE_HEX_LIGHT: readonly string[] =
  PALETTE_HEX.map((hex) => lighten(hex, LIGHTEN_PERCENTS));

/**
 * Цвет палитры по индексу (CSS-переменная). Индекс закольцован по размеру
 * палитры, поэтому вызывающий может передавать любой порядковый номер
 * (позиция датасета, карточки, элемента списка, хеш имени категории).
 *
 * @param index порядковый номер цвета (0-based, закольцован).
 * @returns CSS-цвет палитры (var(--color-palette-N)).
 */
export function paletteColorOf(index: number): string
{
  const wrappedIndex = cycleNumber(index, PALETTE_SIZE);
  const colorNumber = wrappedIndex + 1;

  const color = `var(--color-palette-${colorNumber})`;

  return color;
}

/**
 * Hex-значение цвета палитры по индексу — для JS-вычислений цвета
 * (смешивание с белым в utils/lighten): parseInt не разбирает var(--…),
 * hex обязателен. Индекс закольцован, как в paletteColorOf.
 *
 * @param index порядковый номер цвета (0-based, закольцован).
 * @returns цвет «#RRGGBB».
 */
export function paletteHexOf(index: number): string
{
  const wrappedIndex = cycleNumber(index, PALETTE_SIZE);

  const hex = PALETTE_HEX[wrappedIndex];

  return hex;
}

/**
 * Осветлённый цвет палитры по индексу — hover-подсветка (tint): готовый
 * осветлённый вариант из PALETTE_HEX_LIGHT, без пересчёта на рендер.
 * Индекс закольцован, как в paletteColorOf.
 *
 * @param index порядковый номер цвета (0-based, закольцован).
 * @returns осветлённый цвет «#RRGGBB».
 */
export function paletteHexLightOf(index: number): string
{
  const wrappedIndex = cycleNumber(index, PALETTE_SIZE);

  const hex = PALETTE_HEX_LIGHT[wrappedIndex];

  return hex;
}
