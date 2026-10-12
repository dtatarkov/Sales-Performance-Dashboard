"use client";

/**
 * Обёртка recharts: донат-чарт долей категорий (frontend.md §7; ui.md, блок 7
 * «Продажи по категориям»): hover сегмента ↔ подсветка строки легенды
 * (useHoverGroup в виджете); в центре — активная метрика и сумма (рендерит
 * вызывающий через центр-слот).
 */
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

import { CHART_HEIGHTS, CHART_ANIMATION } from "../../configuration/charts";
import { paletteColorOf } from "../../configuration/colorPalette";

/** Сегмент доната. */
export type DonutSegment = {
  /** Имя категории (ключ hover-группы). */
  name: string;
  /** Доля категории, 0–100. */
  share: number;
};

/**
 * Тип props DonutChart.
 */
type DonutChartProps = {
  /** Сегменты (категории активного датасета). */
  segments: DonutSegment[];
  /** Id подсвеченного сегмента (hover-группа донат↔легенда) или null. */
  highlightedId: string | null;
  /** Центр-слот (активная метрика + сумма). */
  center?: React.ReactNode;
  /** Наведение на сегмент: id категории (ключ hover-группы). */
  onSegmentEnter?: (id: string) => void;
  /** Уход курсора с сегмента. */
  onSegmentLeave?: () => void;
};

/** Внутренний радиус доната, % от контейнера. */
const INNER_RADIUS = "62%";

/** Внешний радиус доната, % от контейнера. */
const OUTER_RADIUS = "92%";

/** Стартовый угол доната (с 12 часов по часовой). */
const START_ANGLE = 90;

/** Концевой угол доната (полный круг). */
const END_ANGLE = -270;

/** Класс контейнера центра: поверх чарта, без перехвата hover. */
const CENTER_OVERLAY_CLASS =
  "pointer-events-none absolute inset-0 flex flex-col items-center justify-center";

/**
 * Стиль подсветки сегмента: усиление цвета (ui.md, блок 7).
 *
 * @param segmentName имя сегмента.
 * @param highlightedId id подсвеченного сегмента или null.
 * @returns inline-стиль подсветки или undefined.
 */
function highlightStyleOf(
  segmentName: string,
  highlightedId: string | null,
): { filter: string } | undefined
{
  const isHighlighted = segmentName === highlightedId;

  const style = isHighlighted ? { filter: "brightness(0.85)" } : undefined;

  return style;
}

/**
 * DonutChart — донат долей (ui.md, блок 7): сегменты вплотную — без
 * углового паддинга и без обводки (stroke="none"); подсвеченный сегмент —
 * усиление цвета; hover сегмента ↔ подсветка легенды — колбэки на Pie
 * (recharts 3 диспатчит их только через пропсы Pie, data.name — ключ
 * группы). Центр — абсолютное позиционирование вызывающего контента.
 * Перестройка доната при смене датасета анимируется: дефолт recharts
 * «auto» (отключена в SSR и при prefers-reduced-motion), сектора
 * сопоставляются по индексу (дефолт matchAppend), длительность и easing —
 * CHART_ANIMATION (configuration/charts.ts). Все вычисления и константы —
 * на уровне модуля (AGENTS.md, «Стиль JSX»).
 *
 * @param props сегменты, подсветка, центр, колбэки hover.
 * @returns чарт с центром.
 */
export function DonutChart({
  segments,
  highlightedId,
  center,
  onSegmentEnter,
  onSegmentLeave,
}: DonutChartProps)
{
  const cells = segments.map((segment, index) =>
  {
    const cell = (
      <Cell
        key={segment.name}
        fill={categoryColorOf(index)}
        style={highlightStyleOf(segment.name, highlightedId)}
      />
    );

    return cell;
  });

  const handleSectorEnter = (data: unknown) =>
  {
    const sectorName = (data as { name?: unknown }).name;

    if (typeof sectorName === "string" && onSegmentEnter !== undefined)
    {
      onSegmentEnter(sectorName);
    }
  };

  const handleSectorLeave = () =>
  {
    if (onSegmentLeave !== undefined)
    {
      onSegmentLeave();
    }
  };

  return (
    <div className="relative" style={{ height: CHART_HEIGHTS.donut }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={segments}
            dataKey="share"
            nameKey="name"
            innerRadius={INNER_RADIUS}
            outerRadius={OUTER_RADIUS}
            startAngle={START_ANGLE}
            endAngle={END_ANGLE}
            stroke="none"
            animationDuration={CHART_ANIMATION.durationMs}
            animationEasing={CHART_ANIMATION.easing}
            onMouseEnter={handleSectorEnter}
            onMouseLeave={handleSectorLeave}
          >
            {cells}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {center !== undefined && (
        <div className={CENTER_OVERLAY_CLASS}>
          {center}
        </div>
      )}
    </div>
  );
}

/**
 * Цвет сегмента по индексу категории — единая палитра приложения; легенда
 * использует ту же функцию.
 *
 * @param index индекс категории в датасете.
 * @returns CSS-цвет из палитры.
 */
export function categoryColorOf(index: number): string
{
  const color = paletteColorOf(index);

  return color;
}