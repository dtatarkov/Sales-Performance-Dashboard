"use client";

import { useState } from "react";

import { BlockShell } from "../../components/ui/BlockShell";
import { EmptyState } from "../../components/ui/EmptyState";
import { TabControl } from "../../components/ui/TabControl";
import {
  TimeAreaChart,
  type AreaChartPoint,
} from "../../components/charts/TimeAreaChart";
import { useTimeSeries, isOneDaySeries } from "../../hooks/domain/useTimeSeries";
import { paletteColorOf } from "../../configuration/colorPalette";
import {
  formatBucketRange,
  formatDateShort,
  formatHourShort,
} from "../../formatters/formatDate";
import { TimeAreaSkeleton } from "../../components/ui/TimeAreaSkeleton";
import type { Dataset } from "../../types/dataset";
import type { TimeSeriesPoint } from "../../types/dashboard";

/** Пустая иконка заглушки динамики во времени. */
const EMPTY_ICON = (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 3v18h18" />

    <path d="M6 15l4-5 3 3 5-7" />
  </svg>
);

/** Опции переключателя метрики динамики во времени (ui.md, блок 6);
    isMoney — ось Y в масштабе млн/тыс (деньги), у счётчика — false. */
const METRIC_OPTIONS = [
  { value: "0", label: "Выручка", isMoney: true },
  { value: "1", label: "Валовая прибыль", isMoney: true },
  { value: "2", label: "Кол-во продаж", isMoney: false },
];

/**
 * Является ли точка якорем дня: первый бакет, начавшийся в свои сутки.
 * Правило подписей оси (ui.md, блок 6): выводятся все точки серии, но
 * подписаны только уникальные дни; якорь есть у каждого дня при любом
 * шаге сетки — соседние начала бакетов отличаются не больше чем на сутки.
 *
 * @param point точка серии.
 * @param previousPoint предыдущая точка или null для первой.
 * @returns true — точку подписываем днём.
 */
function isDayAnchor(point: TimeSeriesPoint, previousPoint: TimeSeriesPoint | null): boolean
{
  if (previousPoint === null)
  {
    return true;
  }

  const dayOf = (date: Date): string => date.toISOString().slice(0, 10);

  return dayOf(point.dateFrom) !== dayOf(previousPoint.dateFrom);
}

/**
 * Собирает точки area-чарта из активного датасета. Ключ категории — ISO
 * начало бакета (уникален, без дублей); видимый текст тика — «уникальные
 * дни» для многодневного периода и часы для однодневного; тултип показывает
 * полуинтервал бакета. Значения — текущий/предыдущий период как есть.
 *
 * @param dataset активный датасет.
 * @returns точки чарта.
 */
function chartPointsOf(dataset: Dataset<TimeSeriesPoint>): AreaChartPoint[]
{
  const items = dataset.items;

  // Факт о сетке серий (однодневный период) — из hooks/domain.
  const isOneDay = isOneDaySeries(items);

  const points = items.map((point, index) =>
  {
    const previousPoint = index > 0 ? items[index - 1] : null;

    let tick: string;

    if (isOneDay)
    {
      tick = formatHourShort(point.dateFrom);
    }
    else if (isDayAnchor(point, previousPoint))
    {
      tick = formatDateShort(point.dateFrom);
    }
    else
    {
      tick = "";
    }

    const range = formatBucketRange(point.dateFrom, point.dateTo, isOneDay);

    return {
      label: point.dateFrom.toISOString(),
      tick,
      range,
      current: point.valueCurrent,
      previous: point.valuePrevious,
    };
  });

  return points;
}

/**
 * Цвет серии активной метрики — позицией датасета (единая палитра).
 *
 * @param datasetIndex индекс активного датасета.
 * @returns CSS-цвет серии.
 */
function seriesColorOf(datasetIndex: number): string
{
  const color = paletteColorOf(datasetIndex);

  return color;
}

/**
 * Виджет блока 6 «Динамика во времени» (frontend-plan.md, этап 9; ui.md,
 * блок 6): area/line-чарт по дням, три датасета. Сплошная линия — активная
 * метрика с заливкой, пунктир — предыдущий период. Одна точка (период =
 * сегодня) чертится корректно (маркер без растягивания — решает чарт).
 *
 * @returns блок динамики во времени.
 */
export function TimeSeriesWidget() {
  const { data, isEmpty, isRefreshing } = useTimeSeries();

  const [activeDatasetIndex, setActiveDatasetIndex] = useState(0);

  const handleMetricChange = (value: string | null) => {
    if (value !== null) {
      setActiveDatasetIndex(Number(value));
    }
  };

  const activeDataset =
    data !== null ? data.datasets[activeDatasetIndex] : null;

  const chartPoints =
    activeDataset !== null ? chartPointsOf(activeDataset) : [];

  const chartColor = seriesColorOf(activeDatasetIndex);

  const isMoneyMetric = METRIC_OPTIONS[activeDatasetIndex]?.isMoney ?? false;

  return (
    <BlockShell
      data={data}
      isEmpty={isEmpty}
      isRefreshing={isRefreshing}
      skeleton={<TimeAreaSkeleton />}
      empty={
        <EmptyState
          icon={EMPTY_ICON}
          title="За выбранный период данных нет"
          hint="Попробуйте изменить период или сегмент"
        />
      }
      title="Динамика во времени"
      size="standard"
      toolbar={
        <TabControl
          options={METRIC_OPTIONS}
          value={`${activeDatasetIndex}`}
          onChange={handleMetricChange}
          ariaLabel="Метрика динамики во времени"
        />
      }
    >
      {data !== null && (
        <div className="h-full">
          <TimeAreaChart
            points={chartPoints}
            color={chartColor}
            isMoney={isMoneyMetric}
          />
        </div>
      )}
    </BlockShell>
  );
}