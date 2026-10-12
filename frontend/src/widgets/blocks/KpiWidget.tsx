"use client";

import { useKpi } from "../../hooks/domain/useKpi";
import { KpiSkeleton } from "../../components/ui/KpiSkeleton";
import { KpiMetricCard } from "../../components/data/KpiMetricCard";
import { BestManagerCard } from "../../components/data/BestManagerCard";

/** Класс сетки KPI: 6 карточек в одну линию, без обёртки-карточки (ui.md,
    блок 1 — блок не является карточкой: без фона, бордера, скролла). */
const KPI_GRID_CLASS = "grid grid-cols-6 gap-4";

/**
 * Виджет блока 1 «KPI-карточки» (frontend-plan.md, этап 9; ui.md, блок 1):
 * не карточка, а ряд из 6 KPI-карточек в одну линию — без фона, бордера,
 * скролла и шапки. Слоты skeleton/empty/content решаются по BlockState.
 *
 * Пустой период (ui.md, «Пустой период без продаж») — не иконка-заглушка,
 * а тот же ряд карточек: каждая показывает «—» и подпись «данных нет»
 * (KpiMetricCard.isEmpty, BestManagerCard с data === null).
 *
 * @returns блок KPI.
 */
export function KpiWidget() {
  // isRefreshing не используется: блок без обёртки-карточки, dimming
  // отдельного слота не имеет; данные меняются на месте (KpiMetricCard).
  const { data, isEmpty } = useKpi();

  if (data === null) {
    return <KpiSkeleton />;
  }

  return (
    <div className={KPI_GRID_CLASS}>
      <KpiMetricCard
        data={data.revenue}
        label="Выручка"
        metricId="revenue"
        colorIndex={1}
        isEmpty={isEmpty}
      />

      <KpiMetricCard
        data={data.gp}
        label="Валовая прибыль"
        metricId="gp"
        colorIndex={2}
        isEmpty={isEmpty}
      />

      <KpiMetricCard
        data={data.margin}
        label="Маржинальность"
        metricId="margin"
        colorIndex={3}
        isEmpty={isEmpty}
      />

      <KpiMetricCard
        data={data.salesCount}
        label="Количество продаж"
        metricId="salesCount"
        colorIndex={4}
        isEmpty={isEmpty}
      />

      <KpiMetricCard
        data={data.avgCheck}
        label="Средний чек"
        metricId="avgCheck"
        colorIndex={5}
        isEmpty={isEmpty}
      />

      <BestManagerCard data={data.bestManager} colorIndex={6} />
    </div>
  );
}
