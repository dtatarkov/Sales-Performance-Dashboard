"use client";

import { Skeleton } from "./Skeleton";

/** Высота KPI-карточки — токен globals.css. */
const KPI_HEIGHT = "var(--kpi-height)";

/**
 * KpiSkeleton — skeleton по форме 6 KPI-карточек (ui.md, «Initial loading»:
 * skeleton повторяет структуру реального содержимого — подпись, число,
 * бейдж, sparkline-зона).
 *
 * @returns сетка скелетонов KPI.
 */
export function KpiSkeleton() {
  const cardStyle = { height: KPI_HEIGHT } as const;

  return (
    <div className="grid grid-cols-6 gap-4">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4"
          style={cardStyle}
        >
          <Skeleton height="10px" width="55%" />

          <Skeleton height="22px" width="75%" />

          <Skeleton height="14px" width="45%" />

          <div className="mt-auto">
            <Skeleton height="36px" width="100%" borderRadius="4px" />
          </div>
        </div>
      ))}
    </div>
  );
}
