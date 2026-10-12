"use client";

import { useState } from "react";

import { BlockShell } from "../../components/ui/BlockShell";
import { DynamicsChart, type DynamicsChartItem } from "../../components/charts/DynamicsChart";
import { EmptyState } from "../../components/ui/EmptyState";
import { TabControl } from "../../components/ui/TabControl";
import { DynamicsSkeleton } from "../../components/ui/DynamicsSkeleton";
import { useCustomerDynamics } from "../../hooks/domain/useCustomerDynamics";
import type { CustomerDynamicsItem } from "../../types/dashboard";

/**
 * Переносит строку динамики в абстракцию ui-слоя: DynamicsChart не знает
 * доменных моделей блока 5 (frontend.md, «Слои»: components не зависят от
 * домена), маппинг полей — ответственность виджета.
 *
 * @param item строка динамики клиентов.
 * @returns строку графика.
 */
function toChartItem(item: CustomerDynamicsItem): DynamicsChartItem
{
  const chartItem: DynamicsChartItem = {
    id: item.id,
    name: item.name,
    barValue: item.valueNormalized,
    absoluteDelta: item.absoluteDelta,
    delta: item.delta,
  };

  return chartItem;
}

/**
 * Переносит секцию динамики в абстракцию ui-слоя.
 *
 * @param items секция динамики клиентов.
 * @returns секцию графика.
 */
function toChartItems(items: CustomerDynamicsItem[]): DynamicsChartItem[]
{
  const chartItems = items.map((item) => toChartItem(item));

  return chartItems;
}

/** Пустая иконка заглушки динамики клиентов. */
const EMPTY_ICON = (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 12h18" />

    <path d="M7 7l5-4 5 4" />

    <path d="M7 17l5 4 5-4" />
  </svg>
);

/** Опции переключателя метрики динамики (ui.md, блок 5). */
const METRIC_OPTIONS = [
  { value: "0", label: "Валовая прибыль" },
  { value: "1", label: "Средний чек" },
];

/**
 * Виджет блока 5 «Динамика клиентов» (frontend-plan.md, этап 9; ui.md,
 * блок 5): переключатель метрики выбирает датасет внутри обеих секций
 * сразу; график — готовые секции «Рост» и «Падение» рисует
 * CustomerDynamicsChart (components/charts).
 *
 * @returns блок динамики клиентов.
 */
export function CustomerDynamicsWidget() {
  const { data, isEmpty, isRefreshing } = useCustomerDynamics();

  const [activeDatasetIndex, setActiveDatasetIndex] = useState(0);

  const handleMetricChange = (value: string | null) => {
    if (value !== null) {
      setActiveDatasetIndex(Number(value));
    }
  };

  const activeGrowth =
    data !== null ? toChartItems(data.growth[activeDatasetIndex].items) : [];

  const activeDecline =
    data !== null ? toChartItems(data.decline[activeDatasetIndex].items) : [];

  return (
    <BlockShell
      data={data}
      isEmpty={isEmpty}
      isRefreshing={isRefreshing}
      skeleton={<DynamicsSkeleton />}
      empty={
        <EmptyState
          icon={EMPTY_ICON}
          title="За выбранный период данных нет"
          hint="Попробуйте изменить период или сегмент"
        />
      }
      title="Динамика клиентов"
      size="standard"
      toolbar={
        <TabControl
          options={METRIC_OPTIONS}
          value={activeDatasetIndex === 0 ? "0" : "1"}
          onChange={handleMetricChange}
          ariaLabel="Метрика динамики клиентов"
        />
      }
    >
      {data !== null && (
        <DynamicsChart growth={activeGrowth} decline={activeDecline} />
      )}
    </BlockShell>
  );
}
