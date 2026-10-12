"use client";

import { Skeleton } from "./Skeleton";

/** Относительные ширины баров по убыванию — имитация рейтинга датасета. */
const BAR_WIDTHS = ["88%", "74%", "63%", "55%", "47%", "40%", "34%", "29%"];

/** Класс строки бара (макет HorizontalBarChart: подпись слева, бар, значение). */
const BAR_ROW_CLASS = "flex items-center gap-3";

/**
 * Тип props HorizontalBarsSkeleton — число баров скелетона.
 */
type HorizontalBarsSkeletonProps = {
  /** Число баров (топ-10 сравнения — 10). */
  rows: number;
};

/**
 * HorizontalBarsSkeleton — skeleton блока 3 «Сравнение менеджеров» по форме
 * HorizontalBarChart (frontend-plan.md, хитрое место №13): подпись слева,
 * убывающие бары, значение справа; строки распределяются по всей высоте
 * карточки (justify-around) — чарт не скроллится, списковый RankedSkeleton
 * здесь давал ложный список и скроллбар.
 *
 * @param props rows — число баров.
 * @returns скелетон горизонтальных баров.
 */
export function HorizontalBarsSkeleton({ rows }: HorizontalBarsSkeletonProps) {
  return (
    <div className="flex h-full flex-col justify-around">
      {Array.from({ length: rows }, (_, index) => {
        const barWidth = BAR_WIDTHS[index % BAR_WIDTHS.length];

        const rowNode = (
          <div key={index} className={BAR_ROW_CLASS}>
            <Skeleton height="10px" width="64px" />

            <Skeleton height="14px" width={barWidth} borderRadius="4px" />

            <Skeleton height="10px" width="44px" />
          </div>
        );

        return rowNode;
      })}
    </div>
  );
}
