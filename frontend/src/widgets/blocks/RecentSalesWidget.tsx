"use client";

import { BlockShell } from "../../components/ui/BlockShell";
import { EmptyState } from "../../components/ui/EmptyState";
import { SaleFeedRow } from "../../components/data/SaleFeedRow";
import { useRecentSales } from "../../hooks/domain/useRecentSales";
import { RecentSalesSkeleton } from "../../components/ui/RecentSalesSkeleton";

/** Пустая иконка заглушки ленты. */
const EMPTY_ICON = (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M20 7l-8-4-8 4v10l8 4 8-4V7z" />
    <path d="M12 3v18" />
  </svg>
);

/**
 * Виджет блока 9 «Последние продажи» (frontend-plan.md, этап 9; ui.md,
 * блок 9): живая лента сделок — первая линия клиент/менеджер/дата/статус,
 * вторая — товары · сумма · ВП. Итоговой агрегатной строки нет (ui.md).
 *
 * @returns блок ленты продаж.
 */
export function RecentSalesWidget() {
  const { data, isEmpty, isRefreshing } = useRecentSales();

  return (
    <BlockShell
      data={data}
      isEmpty={isEmpty}
      isRefreshing={isRefreshing}
      skeleton={<RecentSalesSkeleton />}
      empty={
        <EmptyState
          icon={EMPTY_ICON}
          title="За выбранный период данных нет"
          hint="Попробуйте изменить период или сегмент"
        />
      }
      title="Последние продажи"
      size="standard"
    >
      {data !== null && (
        <div className="flex flex-col gap-3">
          {data.sales.map((sale) => (
            <SaleFeedRow key={sale.id} sale={sale} />
          ))}
        </div>
      )}
    </BlockShell>
  );
}