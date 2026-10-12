import type { Color } from "../types/color";
import type { Delta } from "../types/delta";
import { formatMoney } from "./formatMoney";
import
  {
    moneyScaleOf,
    formatScaledMoneyAmount,
  } from "./moneyScale";
import { MISSING_VALUE_MARKER } from "../configuration/missingValueMarker";

/**
 * Форматированная Δ: текст и цвет (ui.md, «Тип Delta»).
 * Стрелка направления берётся из знака value; U+2212 для минуса.
 */
export type FormattedDelta = {
  /** Текст: «▲ +12,4%», «▼ −0,4 п.п.» или «—» для null. */
  text: string;
  /** Цвет; null-дельта и ноль → neutral (серое «—» и «0,0%»). */
  color: Color;
};

const ARROW_UP = "\u25B2";
const ARROW_DOWN = "\u25BC";
const MINUS_SIGN = "\u2212";
const PERCENT_SUFFIX = "%";
const POINTS_SUFFIX = " п.п.";

/**
 * Префикс стрелки с пробелом-разделителем по знаку числа: «▲ » для роста,
 * «▼ » для падения, пустая строка при нуле (стрелка и знак не рисуются).
 *
 * @param value число.
 * @returns префикс стрелки или пустая строка.
 */
function arrowPrefixOf(value: number): string
{
  if (value > 0)
  {
    return `${ARROW_UP} `;
  }

  if (value < 0)
  {
    return `${ARROW_DOWN} `;
  }

  return "";
}

/**
 * Знак перед абсолютной величиной: «+» для роста, U+2212 для падения,
 * пусто при нуле.
 *
 * @param value число.
 * @returns знак или пустая строка.
 */
function signedOf(value: number): string
{
  if (value > 0)
  {
    return "+";
  }

  if (value < 0)
  {
    return MINUS_SIGN;
  }

  return "";
}

/**
 * Абсолютная величина с одной десятичной цифрой и запятой-разделителем.
 *
 * @param value число.
 * @returns строка вида «12,4».
 */
function absoluteOneDecimalOf(value: number): string
{
  const formatted = Math.abs(value).toFixed(1).replace(".", ",");

  return formatted;
}

/**
 * Пара цветов «хорошей» метрики: рост — positive (зелёный), падение —
 * negative (красный). Для «плохой» метрики пара инвертируется (ui.md,
 * «Цвет Δ по семантике метрики»).
 *
 * @param negative метрика «плохая» (возвраты/отмены).
 * @returns цвета роста и падения.
 */
function colorsOf(negative: boolean): { growthColor: Color; fallColor: Color; }
{
  const growthColor = negative ? "negative" : "positive";
  const fallColor = negative ? "positive" : "negative";

  return { growthColor, fallColor };
}

/**
 * Цвет по знаку числа в палитре UI: рост/падение/нейтральный (ноль).
 *
 * @param value число.
 * @param growthColor цвет при росте.
 * @param fallColor цвет при падении.
 * @returns цвет из Color.
 */
function colorBySignOf(
  value: number,
  growthColor: Color,
  fallColor: Color,
): Color
{
  if (value > 0)
  {
    return growthColor;
  }

  if (value < 0)
  {
    return fallColor;
  }

  return "neutral";
}

/**
 * Текст Δ: «▲ +12,4%», «▼ −0,4 п.п.», при нуле — без стрелки и знака.
 *
 * @param value величина Δ.
 * @param suffix суффикс единицы («%» или « п.п.»).
 * @returns строка текста Δ.
 */
function textOf(value: number, suffix: string): string
{
  const arrowPrefix = arrowPrefixOf(value);
  const sign = signedOf(value);
  const magnitude = absoluteOneDecimalOf(value);

  const text = `${arrowPrefix}${sign}${magnitude}${suffix}`;

  return text;
}

/**
 * Форматирует относительную Δ в процентах — адаптация fmtDelta/goodDelta
 * макета: «▲ +12,4%»; null → «—» серым; ноль — без стрелки и знака.
 *
 * @param value величина Δ в % или null (базовый период пуст).
 * @param negative метрика «плохая» (возвраты/отмены): рост — красный.
 * @returns форматированная Δ.
 */
export function formatDeltaPercent(
  value: number | null,
  negative = false,
): FormattedDelta
{
  if (value === null)
  {
    return { text: MISSING_VALUE_MARKER, color: "neutral" };
  }

  const text = textOf(value, PERCENT_SUFFIX);

  const colors = colorsOf(negative);
  const color = colorBySignOf(value, colors.growthColor, colors.fallColor);

  return { text, color };
}

/**
 * Форматирует Δ доли в процентных пунктах — fmtPts/ptsDelta макета:
 * «▲ +0,9 п.п.»; null → «—» серым; ноль — без стрелки и знака.
 *
 * @param value величина Δ в п.п. или null.
 * @param negative метрика «плохая» (возвраты/отмены): рост — красный.
 * @returns форматированная Δ.
 */
export function formatDeltaPoints(
  value: number | null,
  negative = false,
): FormattedDelta
{
  if (value === null)
  {
    return { text: MISSING_VALUE_MARKER, color: "neutral" };
  }

  const text = textOf(value, POINTS_SUFFIX);

  const colors = colorsOf(negative);
  const color = colorBySignOf(value, colors.growthColor, colors.fallColor);

  return { text, color };
}

/**
 * Форматирует Δ по структуре ui.md, подставляя суффикс из `unit`:
 * percent → «▲ +12,4%», pp → «▼ −0,4 п.п.»; null → «—». Цвет — по семантике
 * метрики: «плохая» (возвраты, отмены) инвертирует зелёный/красный
 * (ui.md, «Цвет Δ по семантике метрики»).
 *
 * @param delta структура Δ или null.
 * @param negative метрика «плохая»; решает вызывающий (виджет).
 * @returns форматированная Δ.
 */
export function formatDelta(delta: Delta | null, negative = false): FormattedDelta
{
  if (delta === null)
  {
    return { text: MISSING_VALUE_MARKER, color: "neutral" };
  }

  const formatted = delta.unit === "percent"
    ? formatDeltaPercent(delta.value, negative)
    : formatDeltaPoints(delta.value, negative);

  return formatted;
}

/**
 * Форматирует абсолютную Δ деньгами со стрелкой направления — первая строка
 * подписи динамики клиентов: «▲ 35 тыс» / «▼ 35 тыс». Стрелка кодирует
 * направление, знак не дублируется (решение по ревью блока 5); валюта при
 * сокращении опускается — «тыс»/«млн» рядом с ценовым баром говорят о деньгах
 * сами; ноль — «0 ₽» без стрелки.
 *
 * @param difference величина Δ в рублях.
 * @returns «▲ X» / «▼ X» с сокращённой денежной единицей.
 */
export function formatArrowMoney(difference: number): string
{
  if (difference === 0)
  {
    return formatMoney(0);
  }

  const arrowPrefix = arrowPrefixOf(difference);
  const scaledAmount = formatScaledMoneyAmount(
    Math.abs(difference),
    moneyScaleOf(Math.abs(difference)),
  );

  const unitSuffix = moneyScaleOf(Math.abs(difference)).unit;

  return `${arrowPrefix}${scaledAmount} ${trimMoneyUnit(unitSuffix)}`;
}

/**
 * Отрезает валюту от подписи денежной единицы: «тыс ₽» → «тыс», «млн ₽» →
 * «млн», «₽» → «₽» (рубли без сокращения пишутся полностью).
 *
 * @param unit подпись единицы (moneyScaleOf).
 * @returns единицу без символа валюты при сокращении.
 */
function trimMoneyUnit(unit: string): string
{
  const trimmed = unit.replace(" ₽", "");

  return trimmed;
}

/**
 * Форматирует относительную Δ со стрелкой без знака — вторая строка подписи
 * динамики клиентов: «▲ 603,9%» / «▼ 11,4 п.п.». null → «—», ноль — без
 * стрелки. Цвет строке задаёт виджет (цвет бара), поэтому текст без цвета.
 *
 * @param delta структура Δ или null (базовый период пуст).
 * @returns текст «▲ X» / «▼ X» / «—».
 */
export function formatArrowDelta(delta: Delta | null): string
{
  if (delta === null)
  {
    return MISSING_VALUE_MARKER;
  }

  const arrowPrefix = arrowPrefixOf(delta.value);
  const suffix = delta.unit === "percent" ? PERCENT_SUFFIX : POINTS_SUFFIX;
  const magnitude = absoluteOneDecimalOf(delta.value);

  return `${arrowPrefix}${magnitude}${suffix}`;
}

/**
 * Форматирует кратность среднему чеку: «1,7×» — вклад неаддитивной метрики
 * (ui.md, «Тип Contribution»); null → «—».
 *
 * @param multiplier кратность или null.
 * @returns «1,7×» или «—» для null.
 */
export function formatMultiplier(multiplier: number | null): string
{
  if (multiplier === null)
  {
    return MISSING_VALUE_MARKER;
  }

  const formatted = `${multiplier.toFixed(1).replace(".", ",")}\u00D7`;

  return formatted;
}