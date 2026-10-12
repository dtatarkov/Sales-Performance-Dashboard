"use client";

/**
 * Обёртка recharts: горизонтальный bar-chart (frontend.md §7, charts/ —
 * props in → чарт). Оси развёрнуты: менеджеры по Y, значения по X (ui.md,
 * блок 3) — длинные подписи читаются без поворота. Денежные наборы
 * нормализуются по максимуму набора (moneyScale): все значения — ось X
 * и tooltip — печатаются в одной единице.
 */
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  LabelList,
} from "recharts";

import { moneyScaleOf, formatScaledMoneyAmount, formatScaledMoney } from "../../formatters/moneyScale";

/** Строка данных горизонтального бара. */
export type HorizontalBarItem = {
  /** Имя менеджера (ось Y, первая строка подписи). */
  name: string;
  /** Команда менеджера (ось Y, вторая строка подписи). */
  team: string;
  /** Значение метрики (ось X). */
  value: number;
  /** Готовый текст Δ (рендерится справа от конца бара, макет .comp-delta). */
  deltaText: string;
  /** CSS-цвет текста Δ (SVG fill); решает вызывающий по семантике. */
  deltaFill: string;
};

/**
 * Тип props HorizontalBarChart — обёртка recharts без домена.
 */
type HorizontalBarChartProps = {
  /** Строки данных (топ-10 по активной метрике). */
  items: HorizontalBarItem[];
  /** Цвет серии датасета. */
  color: string;
  /** Осветлённый цвет серии (hover-подсветка бара, tint). */
  activeColor: string;
  /** Признак денежной метрики: true — единый масштаб по максимуму набора. */
  isMoney: boolean;
  /**
   * Подпись единицы на оси X для неденежных метрик (шт/×); для денежных
   * единица подбирается автоматически (scale.unit).
   */
  unitLabel?: string;
  /** Название активной метрики для tooltip (макет: «Валовая прибыль 1,1 …»). */
  metricLabel: string;
};

/** Отступы чарта внутри контейнера, px (left = 0 — зона подписей оси Y
    прилегает к паддингу карточки, как в макете: padL = 88 без лишнего
    пустого поля слева от имён). */
const CHART_MARGIN = { left: 0, right: 56, top: 8, bottom: 24 };

/**
 * Форматтеры значения метрики: тики оси X печатают число без единицы
 * (единица подписана на оси), tooltip — число с единицей. Для денег оба
 * строятся на одном scale (единая запись числа), для остальных метрик —
 * locale-число и переданная подпись единицы.
 */
type AxisScale = {
  /** Форматтер значения для тиков оси X (число без единицы). */
  formatTickValue: (value: number) => string;
  /** Форматтер значения для tooltip (число с единицей). */
  formatTooltipValue: (value: number) => string;
  /** Подпись единицы для оси X. */
  unit: string;
};

/**
 * Собирает форматтеры значения и подпись единицы оси: для денег — единый
 * масштаб по максимуму набора (значения набора читаются в одной единице,
 * ui.md, «Сквозные правила отображения чисел» + блок 3); для остальных
 * метрик — сырые значения и переданная подпись единицы.
 *
 * @param items строки чарта.
 * @param isMoney признак денежной метрики.
 * @param unitLabel подпись единицы из props (для неденежных метрик).
 * @returns форматтеры тика и tooltip, подпись единицы оси.
 */
function axisScaleOf(
  items: HorizontalBarItem[],
  isMoney: boolean,
  unitLabel?: string,
): AxisScale
{
  if (isMoney === false)
  {
    const formatTickValue = (value: number) => value.toLocaleString("ru-RU");

    const formatTooltipValue = unitLabel === undefined || unitLabel === ""
      ? formatTickValue
      : (value: number) => `${formatTickValue(value)} ${unitLabel}`;

    return { formatTickValue, formatTooltipValue, unit: unitLabel ?? "" };
  }

  const scale = moneyScaleOf(maxValueOf(items));

  const formatTickValue = (value: number) => formatScaledMoneyAmount(value, scale);

  const formatTooltipValue = (value: number) => formatScaledMoney(value, scale);

  return { formatTickValue, formatTooltipValue, unit: scale.unit };
}

/**
 * Максимум значения набора — база подбора денежного масштаба.
 *
 * @param items строки чарта.
 * @returns наибольшее значение метрики или 0 для пустого набора.
 */
function maxValueOf(items: HorizontalBarItem[]): number
{
  if (items.length === 0)
  {
    return 0;
  }

  const maxValue = Math.max(...items.map((item) => item.value));

  return maxValue;
}

/** Стиль пунктира сетки. */
const GRID_DASH = "3 3";

/** Стиль подписей оси X (ui.md: тертиарный текст). */
const X_AXIS_TICK = { fontSize: 11, fill: "var(--text-tertiary)" };

/** Стиль подписи единицы на оси X. */
const X_AXIS_LABEL = {
  position: "insideBottomRight",
  offset: -4,
  fontSize: 11,
  fill: "var(--text-tertiary)",
} as const;

/** Ширина колонки имён и команд у оси Y, px (макет: padL = 88 — подписи
    выровнены вправо, колонка не расширяется под длинные имена). */
const Y_AXIS_WIDTH = 88;

/** Стиль имени на оси Y (первая строка, макет: 11px semibold secondary). */
const Y_NAME_STYLE = { fontSize: 11, fontWeight: 600, fill: "var(--text-secondary)" } as const;

/** Стиль команды на оси Y (вторая строка, макет: 9px tertiary). */
const Y_TEAM_STYLE = { fontSize: 9, fill: "var(--text-tertiary)" } as const;

/** Вертикальный сдвиг имени относительно центра строки, px. */
const Y_NAME_DY = -3;

/** Вертикальный сдвиг команды относительно центра строки, px. */
const Y_TEAM_DY = 9;

/** Класс кастомного tooltip (макет .tooltip: тёмный --surface-inverse,
    мелкий, одна строка). */
const TOOLTIP_CLASS =
  "pointer-events-none whitespace-nowrap rounded-md bg-surface-inverse px-2.5 py-1.5 text-[11px] text-white";

/** Скругление бара: слева прямые углы, справа скруглённые, px. */
const BAR_RADIUS: [number, number, number, number] = [0, 4, 4, 0];

/** Толщина бара, px. */
const BAR_SIZE = 14;

/** Зазор между концом бара и текстом Δ, px (макет: x = w + 6). */
const DELTA_GAP = 6;

/** Стиль текста Δ (макет .comp-delta: 10px, semibold, цвет по семантике). */
const DELTA_TEXT_STYLE = { fontSize: 10, fontWeight: 600 } as const;

/** Props подписи оси Y: строки чарта + поля, которые добавляет recharts. */
type NameTickProps = {
  /** Строки чарта (для доступа к команде по индексу). */
  items: HorizontalBarItem[];
  x?: number;
  y?: number;
  payload?: { value?: string };
  index?: number;
};

/**
 * NameTick — подпись оси Y в две строки: имя (semibold) и команда (tertiary).
 * Команда берётся из строки по индексу (recharts отдаёт значение категории и
 * индекс тика, связывая его с исходным элементом).
 *
 * @param props строки чарта, координаты и payload тика.
 * @returns SVG-подпись оси Y.
 */
function NameTick({ items, x = 0, y = 0, payload, index = 0 }: NameTickProps) {
  const team = items[index]?.team ?? "";

  return (
    <g>
      <text
        x={x}
        y={y}
        dy={Y_NAME_DY}
        textAnchor="end"
        style={Y_NAME_STYLE}
      >
        {payload?.value ?? ""}
      </text>

      <text
        x={x}
        y={y}
        dy={Y_TEAM_DY}
        textAnchor="end"
        style={Y_TEAM_STYLE}
      >
        {team}
      </text>
    </g>
  );
}

/** Props подписи Δ: строки чарта + прямоугольник бара, который даёт recharts. */
type DeltaLabelProps = {
  /** Строки чарта (для текста и цвета Δ по индексу). */
  items: HorizontalBarItem[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
};

/**
 * DeltaLabel — текст Δ справа от конца бара: recharts отдаёт прямоугольник
 * бара (x, y, width, height), текст ставится у правого края со сдвигом
 * DELTA_GAP.
 *
 * @param props строки чарта, координаты и размеры бара.
 * @returns SVG-текст Δ или null.
 */
function DeltaLabel({ items, x = 0, y = 0, width = 0, height = 0, index = 0 }: DeltaLabelProps) {
  const item = items[index];

  if (item === undefined || item.deltaText === "") {
    return null;
  }

  const labelX = x + width + DELTA_GAP;
  const labelY = y + height / 2;

  return (
    <text
      x={labelX}
      y={labelY}
      textAnchor="start"
      dominantBaseline="middle"
      style={DELTA_TEXT_STYLE}
      fill={item.deltaFill}
    >
      {item.deltaText}
    </text>
  );
}

/** Props кастомного tooltip: метрика + поля, которые добавляет recharts. */
type ChartTooltipProps = {
  /** Название активной метрики. */
  metricLabel: string;
  /** Форматтер значения с единицей измерения. */
  formatValue: (value: number) => string;
  active?: boolean;
  payload?: Array<{ value?: number | string; payload?: HorizontalBarItem }>;
};

/**
 * ChartTooltip — tooltip по макету `.tooltip`: одна тёмная строка
 * «Имя · Метрика значение с единицей · Δ-текст». Значение печатается
 * в единой единице набора; подпись единицы дублируется в tooltip, чтобы
 * строка читалась отдельно от чарта. Префикс «Δ» перед текстом дельты
 * не ставится — стрелка направления в тексте самодостаточна.
 *
 * @param props активность, payload recharts, метрика, форматтер значения.
 * @returns тёмную плашку tooltip или null.
 */
function ChartTooltip({ metricLabel, formatValue, active, payload }: ChartTooltipProps) {
  if (active !== true || payload === undefined || payload.length === 0) {
    return null;
  }

  const item = payload[0].payload;

  if (item === undefined) {
    return null;
  }

  const rawValue = typeof payload[0].value === "number"
    ? payload[0].value
    : Number(payload[0].value ?? 0);

  const valueText = formatValue(rawValue);

  const text = `${item.name} · ${metricLabel} ${valueText} · ${item.deltaText}`;

  return <div className={TOOLTIP_CLASS}>{text}</div>;
}

/**
 * HorizontalBarChart — горизонтальные бары (ui.md, блок 3): чарт растянут на
 * всю высоту карточки (ResponsiveContainer height="100%"); ось Y — имя и
 * команда в две строки; справа от столбца — Δ (макет .comp-delta); hover —
 * tooltip по макету. Денежные наборы выводятся в едином масштабе по максимуму
 * набора: числа на оси X и в tooltip — в одной единице; на оси — число,
 * в tooltip — с единицей, подпись единицы также на оси (ui.md, «Сквозные
 * правила отображения чисел»). Обёртка overflow-hidden:
 * tooltip не создаёт скроллбар в скроллящемся контейнере карточки (иначе
 * ResponsiveContainer пересчитывает ширину и чарт мигает). Все вычисления —
 * на уровне модуля.
 *
 * @param props данные, цвет, признак денег, единица, метрика.
 * @returns чарт.
 */
export function HorizontalBarChart({
  items,
  color,
  activeColor,
  isMoney,
  unitLabel,
  metricLabel,
}: HorizontalBarChartProps)
{
  const axisScale = axisScaleOf(items, isMoney, unitLabel);

  const xAxisLabel = { ...X_AXIS_LABEL, value: axisScale.unit };

  // Активный бар — светлый оттенок серии (tint, lighten), а не background-
  // подсветка строки: фон выглядел как чужеродная полоса на всю ширину.
  const activeBarFill = { fill: activeColor };

  const tooltipContent = (
    <ChartTooltip
      metricLabel={metricLabel}
      formatValue={axisScale.formatTooltipValue}
    />
  );

  return (
    <div className="h-full w-full overflow-hidden">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={items} layout="vertical" margin={CHART_MARGIN}>
          <CartesianGrid strokeDasharray={GRID_DASH} horizontal={false} />

          <XAxis
            type="number"
            tick={X_AXIS_TICK}
            axisLine={false}
            tickLine={false}
            tickFormatter={axisScale.formatTickValue}
            label={xAxisLabel}
          />

          <YAxis
            type="category"
            dataKey="name"
            width={Y_AXIS_WIDTH}
            tick={<NameTick items={items} />}
            axisLine={false}
            tickLine={false}
          />

          <RechartsTooltip
            cursor={false}
            content={tooltipContent}
          />

          <Bar
            dataKey="value"
            fill={color}
            radius={BAR_RADIUS}
            barSize={BAR_SIZE}
            activeBar={activeBarFill}
          >
            <LabelList dataKey="value" content={<DeltaLabel items={items} />} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}