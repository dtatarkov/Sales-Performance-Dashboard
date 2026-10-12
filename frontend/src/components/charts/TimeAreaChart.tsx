"use client";

import { useId } from "react";

/**
 * Обёртка recharts: area/line-чарт по бакетам сетки серий (frontend.md §7;
 * ui.md, блок 6 «Динамика во времени»): сплошная линия активной метрики
 * с заливкой, пунктирная серая — предыдущий сопоставимый период.
 */
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from "recharts";
import {
  moneyScaleOf,
  formatScaledMoneyAmount,
  type MoneyScale,
} from "../../formatters/moneyScale";

/** Точка данных area-чарта. */
export type AreaChartPoint = {
  /** Уникальный ключ категории оси X (ISO начало бакета) — без дублей. */
  label: string;
  /** Видимый текст тика оси X; пустая строка — точка без подписи. */
  tick: string;
  /** Текст тултипа: полуинтервал бакета («17 сент, 10:00 – 12:00»). */
  range: string;
  /** Значение активного периода. */
  current: number;
  /** Значение предыдущего периода; null — точки нет. */
  previous: number | null;
};

/**
 * Тип props TimeAreaChart.
 */
type TimeAreaChartProps = {
  /** Точки ряда по дням активного периода. */
  points: AreaChartPoint[];
  /** Цвет серии активной метрики. */
  color: string;
  /** Признак денежной метрики: ось Y в масштабе млн/тыс (moneyScaleOf). */
  isMoney?: boolean;
};

/** Шаблон id градиента заливки: суффикс дополняется useId экземпляра —
    SVG-id глобален в документе, у нескольких чартов id не должны совпадать. */
const FILL_GRADIENT_PREFIX = "time-area-fill";

/** Отступы чарта внутри контейнера, px (left = 0 — зона подписей оси Y
    прилегает к паддингу карточки: recharts и так резервирует ширину оси,
    лишний отступ создавал пустое поле слева от графика). */
const CHART_MARGIN = { top: 8, right: 16, bottom: 8, left: 0 };

/** Стиль пунктира сетки. */
const GRID_DASH = "3 3";

/** Стиль подписей обеих осей (ui.md: тертиарный текст). */
const AXIS_TICK = { fontSize: 11, fill: "var(--text-tertiary)" };

/** Минимальный зазор между подписями дней оси X, px. */
const X_AXIS_MIN_TICK_GAP = 24;

/** Ширина колонки значений оси Y, px. */
const Y_AXIS_WIDTH = 64;

/** Стиль tooltip — поверхность на границе, скруглённый, мелкий текст. */
const TOOLTIP_CONTENT_STYLE = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
};

/** Подписи серий в tooltip по dataKey. */
const SERIES_LABELS: Record<string, string> = {
  current: "Текущий период",
  previous: "Предыдущий период",
};

/**
 * Строит словарь «ключ точки → видимый текст тика»: XAxis работает по
 * уникальным ключам label, а видимый текст подставляет форматтером.
 *
 * @param points точки чарта.
 * @returns словарь для tickFormatter.
 */
function tickTextByLabelOf(points: AreaChartPoint[]): Map<string, string>
{
  const result = new Map(points.map((point) => [point.label, point.tick]));

  return result;
}

/**
 * Строит словарь «ключ точки → текст тултипа» (полуинтервал бакета).
 *
 * @param points точки чарта.
 * @returns словарь для labelFormatter.
 */
function rangeTextByLabelOf(points: AreaChartPoint[]): Map<string, string>
{
  const result = new Map(points.map((point) => [point.label, point.range]));

  return result;
}

/** Толщина линии активного периода, px. */
const CURRENT_STROKE_WIDTH = 2;

/** Радиус точки активного периода, px. */
const CURRENT_DOT_RADIUS = 2;

/** Радиус активной точки (hover), px. */
const CURRENT_ACTIVE_DOT_RADIUS = 4;

/** Толщина пунктира предыдущего периода, px. */
const PREVIOUS_STROKE_WIDTH = 1.5;

/** Шаблон пунктира предыдущего периода. */
const PREVIOUS_DASH = "4 4";

/**
 * Форматтер tooltip: значение в ru-RU + подпись серии по dataKey.
 *
 * @param value сырое значение серии (число или строка).
 * @param name dataKey серии (current/previous).
 * @returns [значение строкой, подпись серии].
 */
function formatTooltip(value: unknown, name: unknown): [string, string]
{
  const numeric = typeof value === "number" ? value : Number(value);
  const seriesLabel = SERIES_LABELS[String(name)] ?? "";

  const formatted = numeric.toLocaleString("ru-RU");

  return [formatted, seriesLabel];
}

/**
 * Форматтер тиков оси Y денежной метрики: значение в масштабе набора
 * (млн/тыс), без подписи единицы — она вынесена в заголовок оси
 * (formatScaledMoneyAmount).
 *
 * @param value сырое значение тика (число или строка).
 * @param scale масштаб набора (moneyScaleOf).
 * @returns значение строкой вида «1,5».
 */
function formatMoneyAxisTick(value: unknown, scale: MoneyScale): string
{
  const numeric = typeof value === "number" ? value : Number(value);

  const formatted = formatScaledMoneyAmount(numeric, scale);

  return formatted;
}

/**
 * Форматтер значений оси Y неденежной метрики: ru-RU-группировка.
 *
 * @param value сырое значение (число или строка).
 * @returns значение строкой.
 */
function formatAxisValue(value: unknown): string
{
  const numeric = typeof value === "number" ? value : Number(value);

  const formatted = numeric.toLocaleString("ru-RU");

  return formatted;
}

/**
 * TimeAreaChart — area + пунктир предыдущего периода (ui.md, блок 6).
 * Пунктир рисуется отдельной линией без заливки; null-точки разрывают
 * линию (connectNulls=false). Одна точка (период = сегодня) чертится
 * маркером без растягивания. Обёртка overflow-hidden: tooltip не создаёт
 * скроллбар в скроллящемся контейнере карточки. Все вычисления и
 * константы — на уровне модуля (AGENTS.md, «Стиль JSX»).
 *
 * Ось X работает по уникальным ключам label (ISO начало бакета): дубли
 * категорий схлопнули бы точки в одну позицию. Видимый текст тика
 * («уникальные дни» или часы) и текст тултипа (полуинтервал бакета)
 * подставляются форматтерами по ключу — подписи готовит виджет.
 *
 * @param props точки, цвет, признак денежной метрики.
 * @returns чарт.
 */
export function TimeAreaChart({ points, color, isMoney = false }: TimeAreaChartProps)
{
  // SVG-id уникален для экземпляра (та же механика, что у clipPath в Sparkline).
  const gradientId = `${FILL_GRADIENT_PREFIX}-${useId()}`;

  const gradient = (
    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={color} stopOpacity={0.25} />

      <stop offset="100%" stopColor={color} stopOpacity={0.02} />
    </linearGradient>
  );

  // Масштаб оси Y денежной метрики — по максимуму ряда (обе серии в одной
  // единице); для неденежной не используется.
  const maxPointValue = Math.max(...points.map((point) => point.current), 0);

  const moneyScale = moneyScaleOf(maxPointValue);

  const yAxisTickFormatter = isMoney
    ? (value: unknown) => formatMoneyAxisTick(value, moneyScale)
    : formatAxisValue;

  // Видимый текст тика и тултипа — по уникальному ключу точки (ISO начало
  // бакета): форматтер тика получает только значение категории, без индекса.
  const tickTextByLabel = tickTextByLabelOf(points);
  const rangeTextByLabel = rangeTextByLabelOf(points);

  return (
    <div className="h-full w-full overflow-hidden">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={CHART_MARGIN}>
          <defs>
            {gradient}
          </defs>

          <CartesianGrid strokeDasharray={GRID_DASH} vertical={false} />

          <XAxis
            dataKey="label"
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            minTickGap={X_AXIS_MIN_TICK_GAP}
            tickFormatter={(label: unknown) => tickTextByLabel.get(String(label)) ?? ""}
          />

          <YAxis
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            width={Y_AXIS_WIDTH}
            tickFormatter={yAxisTickFormatter}
          />

          <RechartsTooltip
            contentStyle={TOOLTIP_CONTENT_STYLE}
            labelFormatter={(label) => rangeTextByLabel.get(String(label)) ?? ""}
            formatter={formatTooltip}
          />

          {/* Сплошная линия активного периода с заливкой. */}
          <Area
            type="monotone"
            dataKey="current"
            stroke={color}
            strokeWidth={CURRENT_STROKE_WIDTH}
            fill={`url(#${gradientId})`}
            dot={{ r: CURRENT_DOT_RADIUS }}
            activeDot={{ r: CURRENT_ACTIVE_DOT_RADIUS }}
          />

          {/* Пунктирная серая линия предыдущего периода; null разрывает. */}
          <Area
            type="monotone"
            dataKey="previous"
            stroke="var(--text-tertiary)"
            strokeWidth={PREVIOUS_STROKE_WIDTH}
            strokeDasharray={PREVIOUS_DASH}
            fill="none"
            dot={false}
            connectNulls={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
