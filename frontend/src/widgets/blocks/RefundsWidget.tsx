"use client";

import { BlockShell } from "../../components/ui/BlockShell";
import { useRefunds } from "../../hooks/domain/useRefunds";
import { LossGroupContent } from "./LossGroupContent";
import { LossGroupEmpty } from "./LossGroupEmpty";
import { LossGroupSkeleton } from "../../components/ui/LossGroupSkeleton";

/**
 * Виджет блока 10 «Возвраты» (frontend-plan.md, этап 9; ui.md, блок 10):
 * разрез жёстко привязан — товары. Независим от «Отмен» (ui.md: потери не
 * сводятся в общий итог).
 *
 * @returns блок возвратов.
 */
export function RefundsWidget() {
  const { data, isEmpty, isRefreshing } = useRefunds();

  return (
    <BlockShell
      data={data}
      isEmpty={isEmpty}
      isRefreshing={isRefreshing}
      skeleton={<LossGroupSkeleton />}
      empty={
        <LossGroupEmpty
          title="Возвратов нет"
          hint="За выбранный период возвратов не зафиксировано"
        />
      }
      title="Возвраты"
      size="small"
    >
      {data !== null && (
        <LossGroupContent
          data={data}
          topHeader="Топ товаров по сумме возвратов"
        />
      )}
    </BlockShell>
  );
}