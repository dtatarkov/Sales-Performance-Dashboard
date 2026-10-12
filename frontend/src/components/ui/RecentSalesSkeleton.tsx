"use client";

import { Skeleton } from "./Skeleton";

/**
 * RecentSalesSkeleton — skeleton ленты продаж по форме строк
 * (ui.md, «Initial loading»: две линии строки + статус-бейдж).
 *
 * @returns скелетон ленты.
 */
export function RecentSalesSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 10 }, (_, index) => (
        <div key={index} className="flex flex-col gap-1.5 border-b border-border pb-3">
          <div className="flex items-center justify-between gap-3">
            <Skeleton height="12px" width="55%" />

            <Skeleton height="16px" width="72px" borderRadius="999px" />
          </div>

          <Skeleton height="10px" width="70%" />
        </div>
      ))}
    </div>
  );
}
