"use client";

import { BlockShell } from "../../components/ui/BlockShell";
import { useCancellations } from "../../hooks/domain/useCancellations";
import { LossGroupContent } from "./LossGroupContent";
import { LossGroupEmpty } from "./LossGroupEmpty";
import { LossGroupSkeleton } from "../../components/ui/LossGroupSkeleton";

/**
 * Виджет блока 10 «Отмены» (frontend-plan.md, этап 9; ui.md, блок 10):
 * разрез жёстко привязан — менеджеры. Независим от «Возвратов».
 *
 * @returns блок отмен.
 */
export function CancellationsWidget() {
  const { data, isEmpty, isRefreshing } = useCancellations();

  return (
    <BlockShell
      data={data}
      isEmpty={isEmpty}
      isRefreshing={isRefreshing}
      skeleton={<LossGroupSkeleton />}
      empty={
        <LossGroupEmpty
          title="Отмен нет"
          hint="За выбранный период отмен не зафиксировано"
        />
      }
      title="Отмены"
      size="small"
    >
      {data !== null && (
        <LossGroupContent
          data={data}
          topHeader="Топ менеджеров по сумме отмен"
        />
      )}
    </BlockShell>
  );
}