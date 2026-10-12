"use client";

import { Skeleton } from "./Skeleton";

/** Размер доната (верхняя часть карточки, макет DonutChart). */
const DONUT_SIZE = "200px";

/** Отступ дырки доната от края круга — толщина кольца. */
const DONUT_HOLE_INSET = "60px";

/** Число строк легенды в скелетоне. */
const LEGEND_ROW_COUNT = 6;

/** Колонки легенды (ui.md, блок 7: маркер+категория, выручка, ВП, маржа, продажи). */
const LEGEND_GRID_STYLE = {
  gridTemplateColumns: "1.4fr repeat(4, minmax(0, 1fr))",
} as const;

/** Класс строки легенды: строки делят высоту легенды — блок прижат к низу. */
const LEGEND_ROW_CLASS =
  "grid min-h-0 flex-1 items-center gap-2 border-b border-border";

/**
 * CategoriesSkeleton — skeleton блока 7 «Продажи по категориям» по форме
 * контента (frontend-plan.md, хитрое место №13): донат сверху — пульсирующее
 * кольцо (круг Skeleton с дыркой цвета поверхности) — и легенда-таблица со
 * шапкой и строками «маркер/категория/значения», занимающая остаток высоты.
 * Списковый RankedSkeleton не отражал ни донат, ни таблицу.
 *
 * @returns скелетон категорий.
 */
export function CategoriesSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <div
        className="relative mx-auto mt-2"
        style={{ width: DONUT_SIZE, height: DONUT_SIZE }}
      >
        <Skeleton height={DONUT_SIZE} width={DONUT_SIZE} borderRadius="999px" />

        {/* Дырка доната: цвет поверхности поверх пульсирующего круга. */}
        <div
          className="absolute rounded-full"
          style={{ inset: DONUT_HOLE_INSET, backgroundColor: "var(--surface)" }}
        />
      </div>

      <div className="mt-6 flex min-h-0 flex-1 flex-col">
        {/* Шапка легенды — подписи колонок. */}
        <div className="grid gap-2 pb-2" style={LEGEND_GRID_STYLE}>
          {Array.from({ length: 5 }, (_, index) => {
            const headerNode = (
              <Skeleton key={index} height="8px" width="70%" />
            );

            return headerNode;
          })}
        </div>

        {Array.from({ length: LEGEND_ROW_COUNT }, (_, index) => {
          const rowNode = (
            <div key={index} className={LEGEND_ROW_CLASS} style={LEGEND_GRID_STYLE}>
              <div className="flex items-center gap-2">
                <Skeleton height="10px" width="10px" borderRadius="999px" />

                <Skeleton height="10px" width="70%" />
              </div>

              <Skeleton height="10px" width="60%" />

              <Skeleton height="10px" width="60%" />

              <Skeleton height="10px" width="50%" />

              <Skeleton height="10px" width="40%" />
            </div>
          );

          return rowNode;
        })}
      </div>
    </div>
  );
}
