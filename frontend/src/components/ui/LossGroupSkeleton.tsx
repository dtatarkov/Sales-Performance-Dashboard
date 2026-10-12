"use client";

import { Skeleton } from "./Skeleton";

/** Число строк топа в скелетоне (макет LossTopRow). */
const TOP_ROW_COUNT = 6;

/** Класс строки топа: бейдж, имя, бар+доля справа; строки делят высоту. */
const TOP_ROW_CLASS =
  "flex min-h-0 flex-1 items-center gap-3 border-b border-border";

/**
 * LossGroupSkeleton — skeleton группы потерь по форме LossGroupContent
 * (ui.md, «Initial loading»; frontend-plan.md, хитрое место №13): крупное
 * число + доля, sparkline, заголовок топа и строки топа, распределяющиеся
 * по остатку высоты карточки (flex-1) — скелетон заполняет карточку целиком,
 * как контент, не оставляя пустого низа.
 *
 * @returns скелетон группы потерь.
 */
export function LossGroupSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* Крупное число суммы группы + доля с Δ. */}
      <div className="flex items-baseline justify-between gap-2">
        <Skeleton height="28px" width="120px" />

        <Skeleton height="16px" width="96px" borderRadius="999px" />
      </div>

      {/* Sparkline группы. */}
      <Skeleton height="36px" borderRadius="4px" />

      {/* Заголовок топа. */}
      <Skeleton height="10px" width="45%" />

      {/* Топ: строки распределяются по остатку высоты карточки. */}
      <div className="flex min-h-0 flex-1 flex-col">
        {Array.from({ length: TOP_ROW_COUNT }, (_, index) => {
          const rowNode = (
            <div key={index} className={TOP_ROW_CLASS}>
              <Skeleton height="20px" width="20px" borderRadius="6px" />

              <Skeleton height="10px" width="35%" />

              <div className="ml-auto flex items-center gap-2.5">
                <Skeleton height="4px" width="90px" borderRadius="2px" />

                <Skeleton height="10px" width="52px" />
              </div>
            </div>
          );

          return rowNode;
        })}
      </div>
    </div>
  );
}
