"use client";

import { Skeleton } from "./Skeleton";

/**
 * Тип props RankedSkeleton — skeleton ранжированных списков (блоки 2/4/8):
 * строка уровня 1 (позиция, маркер, имя, трек+значение, вклад) + сетка
 * уровня 2.
 */
type RankedSkeletonProps = {
  /** Число строк скелетона. */
  rows: number;
  /** Число колонок сетки уровня 2 (рейтинг/клиенты — 3, продукты — 5). */
  columns?: number;
};

/** Класс строки-контейнера (макет .lb-row/.tp-item: разделитель снизу). */
const ROW_CLASS = "flex flex-col gap-2 border-b border-border pb-4";

/** Класс строки уровня 1 (макет .lb-row-top/.tp-line1). */
const TOP_CLASS = "flex items-center gap-3";

/**
 * RankedSkeleton — skeleton ранжированных списков (блоки 2/4/8): повторяет
 * структуру строки уровня 1 — маркер позиции (RankBadge 24×24, радиус 6),
 * имя, трек 90px + значение справа, вклад под ними; ниже — сетка уровня 2
 * из колонок «подпись/значение» (ui.md, «Initial loading»: skeleton
 * повторяет структуру контента).
 *
 * @param props rows число строк, columns число колонок сетки.
 * @returns скелетон списка.
 */
export function RankedSkeleton({ rows = 8, columns = 3 }: RankedSkeletonProps) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: rows }, (_, index) => {
        const rowNode = (
          <div key={index} className={ROW_CLASS}>
            <div className={TOP_CLASS}>
              <Skeleton height="24px" width="24px" borderRadius="6px" />

              <Skeleton height="12px" width="140px" />

              <div className="ml-auto flex items-center gap-2.5">
                <Skeleton height="4px" width="90px" borderRadius="2px" />

                <Skeleton height="13px" width="80px" />
              </div>
            </div>

            <div className="flex justify-end gap-2.5">
              <Skeleton height="10px" width="120px" />
            </div>

            <div className="grid gap-2 pl-9" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
              {Array.from({ length: columns }, (_, cellIndex) => {
                const cellNode = (
                  <div key={cellIndex} className="flex flex-col gap-1">
                    <Skeleton height="8px" width="60%" />

                    <Skeleton height="10px" width="80%" />
                  </div>
                );

                return cellNode;
              })}
            </div>
          </div>
        );

        return rowNode;
      })}
    </div>
  );
}
