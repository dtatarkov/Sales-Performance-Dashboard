"use client";

import { useState } from "react";

import { BlockShell } from "../../components/ui/BlockShell";
import { EmptyState } from "../../components/ui/EmptyState";
import { TabControl } from "../../components/ui/TabControl";
import {
  HorizontalBarChart,
  type HorizontalBarItem,
} from "../../components/charts/HorizontalBarChart";
import { useManagerComparison } from "../../hooks/domain/useManagerComparison";
import { paletteHexOf, paletteHexLightOf } from "../../configuration/colorPalette";
import { formatDelta } from "../../formatters/formatDelta";
import { HorizontalBarsSkeleton } from "../../components/ui/HorizontalBarsSkeleton";
import type { Dataset } from "../../types/dataset";
import type { ManagerComparisonItem } from "../../types/dashboard";

/** Пустая иконка заглушки сравнения. */
const EMPTY_ICON = (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M5 12h14" />

    <path d="M5 6h9" />

    <path d="M5 18h6" />
  </svg>
);

/** Опции переключателя метрики сравнения (ui.md, блок 3). */
const METRIC_OPTIONS = [
  { value: "0", label: "Валовая прибыль" },
  { value: "1", label: "Средний чек" },
];

/** CSS-цвет текста Δ по палитре UI (SVG fill, макет .comp-delta.up/.down). */
const DELTA_FILL: Record<string, string> = {
  positive: "var(--success)",
  negative: "var(--danger)",
  neutral: "var(--text-tertiary)",
};

/**
 * Собирает строки чарта из активного датасета: имя, команда, значение и
 * готовый текст Δ с цветом (макет: Δ — SVG-текст справа от конца столбца).
 *
 * @param dataset активный датасет.
 * @returns строки чарта.
 */
function chartItemsOf(dataset: Dataset<ManagerComparisonItem>): HorizontalBarItem[]
{
  const items = dataset.items.map((item) =>
  {
    const formatted = formatDelta(item.delta);

    const chartItem = {
      name: item.name,
      team: item.team,
      value: item.value,
      deltaText: formatted.text,
      deltaFill: DELTA_FILL[formatted.color],
    };

    return chartItem;
  });

  return items;
}

/**
 * Цвет серии активной метрики — позицией датасета (единая палитра). Hex
 * (не CSS-переменная): цвет участвует в hover-подсветке бара, осветлённый
 * вариант берётся из прекомпьюченной светлой палитры.
 *
 * @param datasetIndex индекс активного датасета.
 * @returns hex-цвет серии.
 */
function seriesColorOf(datasetIndex: number): string
{
  const color = paletteHexOf(datasetIndex);

  return color;
}

/**
 * Осветлённый цвет серии (hover-подсветка бара) — из светлой палитры,
 * тем же индексом датасета.
 *
 * @param datasetIndex индекс активного датасета.
 * @returns осветлённый hex-цвет серии.
 */
function seriesActiveColorOf(datasetIndex: number): string
{
  const color = paletteHexLightOf(datasetIndex);

  return color;
}

/**
 * Название активной метрики для tooltip (совпадает с подписью таба).
 *
 * @param datasetIndex индекс активного датасета.
 * @returns название метрики.
 */
function metricLabelOf(datasetIndex: number): string
{
  const label = METRIC_OPTIONS[datasetIndex].label;

  return label;
}

/**
 * Виджет блока 3 «Сравнение менеджеров» (frontend-plan.md, этап 9; ui.md,
 * блок 3): свой переключатель метрики, горизонтальный bar-chart с осями,
 * развёрнутыми (менеджеры по Y). Ростер — топ-10 по активной метрике;
 * при переключении меняются состав и порядок строк. Справа от каждого
 * столбца — Δ (ui.md: цвет по семантике).
 *
 * @returns блок сравнения менеджеров.
 */
export function ManagerComparisonWidget() {
  const { data, isEmpty, isRefreshing } = useManagerComparison();

  const [activeDatasetIndex, setActiveDatasetIndex] = useState(0);

  const handleMetricChange = (value: string | null) => {
    if (value !== null) {
      setActiveDatasetIndex(Number(value));
    }
  };

  const activeDataset =
    data !== null ? data.datasets[activeDatasetIndex] : null;

  const chartItems =
    activeDataset !== null ? chartItemsOf(activeDataset) : [];

  const chartColor = seriesColorOf(activeDatasetIndex);

  const chartActiveColor = seriesActiveColorOf(activeDatasetIndex);

  const metricLabel = metricLabelOf(activeDatasetIndex);

  return (
    <BlockShell
      data={data}
      isEmpty={isEmpty}
      isRefreshing={isRefreshing}
      skeleton={<HorizontalBarsSkeleton rows={10} />}
      empty={
        <EmptyState
          icon={EMPTY_ICON}
          title="За выбранный период данных нет"
          hint="Попробуйте изменить период или сегмент"
        />
      }
      title="Сравнение менеджеров"
      size="standard"
      toolbar={
        <TabControl
          options={METRIC_OPTIONS}
          value={activeDatasetIndex === 0 ? "0" : "1"}
          onChange={handleMetricChange}
          ariaLabel="Метрика сравнения"
        />
      }
    >
      {data !== null && (
        <div className="h-full">
          <HorizontalBarChart
            items={chartItems}
            color={chartColor}
            activeColor={chartActiveColor}
            isMoney={true}
            metricLabel={metricLabel}
          />
        </div>
      )}
    </BlockShell>
  );
}