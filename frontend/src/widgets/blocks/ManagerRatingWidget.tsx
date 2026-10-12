"use client";

import { useState } from "react";

import { BlockShell } from "../../components/ui/BlockShell";
import { EmptyState } from "../../components/ui/EmptyState";
import { TabControl } from "../../components/ui/TabControl";
import { ManagerRatingRow } from "../../components/data/ManagerRatingRow";
import { useManagerRating } from "../../hooks/domain/useManagerRating";
import { RankedSkeleton } from "../../components/ui/RankedSkeleton";
import type { ManagerRatingItem } from "../../types/dashboard";

/** Пустая иконка заглушки рейтинга. */
const EMPTY_ICON = (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="9" cy="8" r="3" />

    <path d="M4 20c0-3 2.2-5 5-5s5 2 5 5" />

    <circle cx="17" cy="9" r="2.5" />

    <path d="M15.5 15.5c2.5.3 4.5 2 4.5 4.5" />
  </svg>
);

/** Опции переключателя метрики рейтинга (ui.md, блок 2). */
const METRIC_OPTIONS = [
  { value: "0", label: "Валовая прибыль" },
  { value: "1", label: "Средний чек" },
];

/**
 * Виджет блока 2 «Рейтинг менеджеров» (frontend-plan.md, этап 9; ui.md,
 * блок 2): переключатель Валовая прибыль | Средний чек, ранжированный список
 * со скроллом. Активный датасет — локальное состояние (без перезапроса,
 * ui.md: «Все датасеты приходят одновременно»).
 *
 * Менеджер без продаж остаётся в списке с нулями и приглушённым стилем
 * (ui.md) — строки рендерятся по данным as-is.
 *
 * @returns блок рейтинга менеджеров.
 */
export function ManagerRatingWidget() {
  const { data, isEmpty, isRefreshing } = useManagerRating();

  // Активный датасет — индекс (0=ВП, 1=СЧ); переключение без перезапроса.
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
      title="Рейтинг менеджеров"
      size="standard"
      toolbar={
        <TabControl
          options={METRIC_OPTIONS}
          value={activeDatasetIndex === 0 ? "0" : "1"}
          onChange={handleMetricChange}
          ariaLabel="Метрика рейтинга"
        />
      }
    >
      {data !== null && (
        <div className={className}>
          {/* Ключ — индекс: строки не размонтируются, бары и вклад
              перетекают prev → current (README, «UI-правила»). */}
          {activeItems.map(
            (item: ManagerRatingItem, index: number) => (
              <ManagerRatingRow
                key={index}
                position={index + 1}
                item={item}
                seriesIndex={activeDatasetIndex}
              />
            ),
          )}
        </div>
      )}
    </BlockShell>
  );
}