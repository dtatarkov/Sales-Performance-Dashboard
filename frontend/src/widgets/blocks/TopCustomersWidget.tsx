"use client";

import { useState } from "react";

import { BlockShell } from "../../components/ui/BlockShell";
import { EmptyState } from "../../components/ui/EmptyState";
import { TabControl } from "../../components/ui/TabControl";
import { CustomerTopRow } from "../../components/data/CustomerTopRow";
import { useTopCustomers } from "../../hooks/domain/useTopCustomers";
import { RankedSkeleton } from "../../components/ui/RankedSkeleton";

/** Пустая иконка заглушки топ-клиентов. */
const EMPTY_ICON = (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="8" r="4" />

    <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
  </svg>
);

/** Опции переключателя метрики топ-клиентов (ui.md, блок 4). */
const METRIC_OPTIONS = [
  { value: "0", label: "Валовая прибыль" },
  { value: "1", label: "Средний чек" },
];

/**
 * Виджет блока 4 «Клиенты — Топ-10» (frontend-plan.md, этап 9; ui.md,
 * блок 4): переключатель ВП | СЧ, ранжированный список. Вклад приходит
 * готовым; доли возвратов/отмен — null при недостаточной выборке («—»).
 *
 * @returns блок топ-клиентов.
 */
export function TopCustomersWidget() {
  const { data, isEmpty, isRefreshing } = useTopCustomers();

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
      title="Клиенты — Топ-10"
      size="standard"
      toolbar={
        <TabControl
          options={METRIC_OPTIONS}
          value={activeDatasetIndex === 0 ? "0" : "1"}
          onChange={handleMetricChange}
          ariaLabel="Метрика топ-клиентов"
        />
      }
    >
      {data !== null && (
        <div className={className}>
          {/* Ключ — индекс: строки не размонтируются, бары и вклад
              перетекают prev → current (README, «UI-правила»). */}
          {activeItems.map((item, index) => (
            <CustomerTopRow
              key={index}
              position={index + 1}
              item={item}
              seriesIndex={activeDatasetIndex}
            />
          ))}
        </div>
      )}
    </BlockShell>
  );
}