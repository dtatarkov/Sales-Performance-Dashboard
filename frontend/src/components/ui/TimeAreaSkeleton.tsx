"use client";

import { Skeleton } from "./Skeleton";

/** Профиль серии area-чарта для clip-path (имитация горбов динамики). */
const AREA_CLIP_PATH =
  "polygon(0 100%, 0 62%, 10% 48%, 22% 70%, 34% 26%, 46% 52%, 58% 34%, 72% 66%, 84% 18%, 100% 42%, 100% 100%)";

/** Позиции горизонтальных линий сетки (доля высоты области графика). */
const GRID_LINE_TOPS = [25, 50, 75];

/** Число подписей на оси X. */
const X_LABEL_COUNT = 6;

/**
 * TimeAreaSkeleton — skeleton блока 6 «Динамика во времени» по форме
 * TimeAreaChart (frontend-plan.md, хитрое место №13 — skeleton повторяет
 * структуру контента): пульсирующий силуэт серии, обрезанный clip-path по
 * профилю area-графика, линии сетки и подписи оси X. Чарт не скроллится —
 * списковый RankedSkeleton здесь давал ложную строку-список и скроллбар.
 *
 * @returns скелетон area-чарта.
 */
export function TimeAreaSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <div className="relative min-h-0 flex-1">
        {/* Силуэт серии: пульсирующий блок, обрезанный по профилю area. */}
        <div className="absolute inset-0" style={{ clipPath: AREA_CLIP_PATH }}>
          <Skeleton height="100%" borderRadius="0px" />
        </div>

        {/* Горизонтальные линии сетки — видимы над силуэтом серии. */}
        {GRID_LINE_TOPS.map((top) => {
          const lineNode = (
            <div
              key={top}
              className="absolute left-0 right-0"
              style={{ top: `${top}%` }}
            >
              <Skeleton height="1px" borderRadius="0px" />
            </div>
          );

          return lineNode;
        })}
      </div>

      {/* Подписи оси X. */}
      <div className="flex justify-between pt-2">
        {Array.from({ length: X_LABEL_COUNT }, (_, index) => {
          const labelNode = (
            <Skeleton key={index} height="8px" width="40px" />
          );

          return labelNode;
        })}
      </div>
    </div>
  );
}
