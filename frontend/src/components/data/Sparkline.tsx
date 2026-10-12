"use client";

import { useId } from "react";

import { CHART_HEIGHTS } from "../../configuration/charts";

/**
 * Тип props Sparkline — мини-график дневной динамики (frontend.md §7; ui.md,
 * KPI: «sparkline дневной динамики за период, прижат к нижнему краю»).
 */
type SparklineProps = {
  /** Значения ряда (по дням). */
  values: number[];
  /** Цвет линии (CSS-цвет). */
  color: string;
};

/** Дефолтная высота спарклайна — типоразмер из реестра (configuration/charts.ts). */
const DEFAULT_HEIGHT = CHART_HEIGHTS.sparkline;

/** Логическая ширина viewBox, px. */
const VIEWBOX_WIDTH = 100;

/** Внутренний паддинг линии, px. */
const LINE_PADDING = 2;

/** Радиус точки при единственном значении, px. */
const SINGLE_POINT_RADIUS = 2;

/** Толщина линии, px. */
const STROKE_WIDTH = 1.5;

/**
 * Ключ перезапуска анимации: значения ряда, склеенные в строку — React
 * пересоздаёт clip-прямоугольник при смене данных, CSS-анимация прорисовки
 * перезапускается (globals.css, .sparkline-clip).
 *
 * @param values значения ряда.
 * @returns строку-ключ.
 */
function drawKeyOf(values: number[]): string {
  const key = values.join(",");

  return key;
}

/**
 * Собирает d-атрибут path по точкам ряда: «M x0,y0 L x1,y1 …». Path вместо
 * polyline — единый элемент линии для clip-прорисовки.
 *
 * @param points пары «x,y».
 * @returns d-атрибут.
 */
function pathDOf(points: string[]): string {
  const d = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point}`)
    .join(" ");

  return d;
}

/**
 * Sparkline — SVG-линия по точкам ряда (frontend.md §7). Оси/подписи
 * отсутствуют — это контекстная динамика; ноль точек не рисует ничего
 * (одна точка рисуется точкой). Все вычисления — в теле или функциях
 * модуля (AGENTS.md, «Стиль JSX»).
 *
 * Нормализация: значения масштабируются в [min, max] ряда; при равных
 * значениях линия — посередине. При появлении/смене данных линия
 * «прорисовывается» слева направо.
 *
 * Прорисовка — clip-прямоугольником, а не stroke-dasharray: dash с нулевым
 * зазором оставлял дыры в линии на почти коллинеарных сегментах (ряды
 * потерь: длинные нулевые плато с редкими пиками). Прямоугольник растёт
 * scaleX 0 → 1 (globals.css, .sparkline-clip), линия всегда сплошная.
 * clipPath уникален для экземпляра (useId) — иначе несколько спарклайнов
 * страницы ссылались бы на один клип с одинаковым id. Длительность —
 * CHART_ANIMATION (ui.md, «Анимации»).
 *
 * @param props значения, цвет.
 * @returns svg-спарклайн.
 */
export function Sparkline({ values, color }: SparklineProps) {
  const height = DEFAULT_HEIGHT;

  const clipId = useId();

  const emptyPlaceholder = <div aria-hidden style={{ height }} />;

  if (values.length === 0) {
    return emptyPlaceholder;
  }

  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = maximum - minimum;

  // Равные значения → средняя линия; range=0 защищает от деления на ноль.
  const scaleX = (index: number) =>
    LINE_PADDING +
    (index / Math.max(values.length - 1, 1)) * (VIEWBOX_WIDTH - LINE_PADDING * 2);

  const scaleY = (value: number) =>
    range === 0
      ? height / 2
      : LINE_PADDING + (1 - (value - minimum) / range) * (height - LINE_PADDING * 2);

  const points = values
    .map((value, index) => `${scaleX(index)},${scaleY(value)}`)
    .join(" ");

  const pathD = pathDOf(points.split(" "));

  const drawKey = drawKeyOf(values);

  const singlePoint = (
    <circle
      cx={VIEWBOX_WIDTH / 2}
      cy={height / 2}
      r={SINGLE_POINT_RADIUS}
      fill={color}
    />
  );

  // Прорисовка через clip: прямоугольник нулевой ширины растёт до полной
  // ширины (CSS-анимация sparkline-clip, globals.css) — линия всегда
  // сплошная, независимо от геометрии сегментов.
  const clipRect = (
    <clipPath id={clipId}>
      <rect
        className="sparkline-clip"
        key={drawKey}
        x={0}
        y={0}
        width={VIEWBOX_WIDTH}
        height={height}
      />
    </clipPath>
  );

  const linePath = (
    <path
      d={pathD}
      fill="none"
      stroke={color}
      strokeWidth={STROKE_WIDTH}
      strokeLinecap="round"
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
      clipPath={`url(#${clipId})`}
    />
  );

  return (
    <svg
      aria-hidden
      width="100%"
      height={height}
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${height}`}
      preserveAspectRatio="none"
      className="overflow-visible"
    >
      {clipRect}

      {values.length === 1 ? singlePoint : linePath}
    </svg>
  );
}
