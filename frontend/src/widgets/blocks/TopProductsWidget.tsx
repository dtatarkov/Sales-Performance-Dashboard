"use client";

import { useState } from "react";

import { BlockShell } from "../../components/ui/BlockShell";
import { EmptyState } from "../../components/ui/EmptyState";
import { TabControl } from "../../components/ui/TabControl";
import { RankedSkeleton } from "../../components/ui/RankedSkeleton";
import { ProductTopRow } from "../../components/data/ProductTopRow";
import { useTopProducts } from "../../hooks/domain/useTopProducts";
import { paletteColorOf } from "../../configuration/colorPalette";
import type { ProductItem } from "../../types/dashboard";

/** Пустая иконка заглушки лучших продуктов. */
const EMPTY_ICON = (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M20 7l-8-4-8 4v10l8 4 8-4V7z" />

    <path d="M12 3v18" />

    <path d="M4 7l8 4 8-4" />
  </svg>
);

/** Опции переключателя метрики продуктов (ui.md, блок 8). */
const METRIC_OPTIONS = [
  { value: "0", label: "Выручка" },
  { value: "1", label: "Валовая прибыль" },
  { value: "2", label: "Продано шт" },
];

/**
 * Виджет блока 8 «Лучшие продукты — Топ-10» (frontend-plan.md, этап 9;
 * ui.md, блок 8): переключатель Выручка | ВП | Продано шт, жёсткий топ-10
 * со скроллом. Товаров меньше десяти — показывается сколько есть.
 *
 * @returns блок лучших продуктов.
 */
export function TopProductsWidget() {
  const { data, isEmpty, isRefreshing } = useTopProducts();

  const [activeDatasetIndex, setActiveDatasetIndex] = useState(0);

  const handleMetricChange = (value: string | null) => {
    if (value !== null) {
      setActiveDatasetIndex(Number(value));
    }
  };

  const activeItems =
    data !== null ? data.datasets[activeDatasetIndex].items : [];

  const className =
    "flex h-full flex-col gap-0 pr-2";

  return (
    <BlockShell
      data={data}
      isEmpty={isEmpty}
      isRefreshing={isRefreshing}
      skeleton={<RankedSkeleton rows={8} />}
      empty={
        <EmptyState
          icon={EMPTY_ICON}
          title="За выбранный период данных нет"
          hint="Попробуйте изменить период или сегмент"
        />
      }
      title="Лучшие продукты — Топ-10"
      size="standard"
      toolbar={
        <TabControl
          options={METRIC_OPTIONS}
          value={`${activeDatasetIndex}`}
          onChange={handleMetricChange}
          ariaLabel="Метрика лучших продуктов"
        />
      }
    >
      {data !== null && (
        <div className={className}>
          {/* Ключ — индекс: строки не размонтируются, бары и вклад
              перетекают prev → current (README, «UI-правила»). */}
          {activeItems.map(
            (item: ProductItem, index: number) => (
              <ProductTopRow
                key={index}
                position={index + 1}
                item={item}
                seriesIndex={activeDatasetIndex}
                markerColor={paletteColorOf(index)}
              />
            ),
          )}
        </div>
      )}
    </BlockShell>
  );
}