"use client";

import { Skeleton } from "./Skeleton";
import { DYNAMICS_SECTION_SIZE } from "../../configuration/dynamics";

/** Строк в секции — Dyn Top N (configuration/dynamics.ts). */
const SECTION_ROW_COUNT = DYNAMICS_SECTION_SIZE;

/** Относительные ширины баров секций (Рост — убывают, Падение — растут). */
const GROWTH_BAR_WIDTHS = ["70%", "60%", "50%", "40%", "32%"];
const DECLINE_BAR_WIDTHS = ["32%", "42%", "52%", "62%", "70%"];

/** Класс секции: заголовок + строки, секции делят высоту карточки. */
const SECTION_CLASS = "flex min-h-0 flex-1 flex-col";

/** Класс строки динамики: имя, бакет бара с осью, резерв подписи Δ. */
const ROW_CLASS = "flex min-h-0 flex-1 items-center gap-3";

/** Класс бакета бара: self-stretch — зона берёт высоту строки (внутри только
    absolute-элементы, items-center строки сжал бы её в ноль); overflow-hidden
    — бары не рождают горизонтальный скроллбар (50% смещение + ширина бара
    выходят за край). */
const BAR_ZONE_CLASS =
  "relative min-w-0 flex-1 self-stretch overflow-hidden";

/** Класс вертикальной оси бакета (макет DynamicsChart: dashed по центру). */
const AXIS_CLASS = "absolute bottom-1 top-1 left-1/2 w-0 border-l border-dashed border-border";

/**
 * DynamicsSkeleton — skeleton блока 5 «Динамика клиентов» по форме
 * DynamicsChart (frontend-plan.md, хитрое место №13): две секции «Рост» и
 * «Падение» с divergent-барами от центральной оси — имя слева, бар растёт
 * вправо (Рост) или влево (Падение), резерв подписи Δ справа. Секции делят
 * высоту карточки — без скроллбара (списковый RankedSkeleton давал ложный
 * список и прокрутку).
 *
 * @returns скелетон динамики клиентов.
 */
export function DynamicsSkeleton() {
  return (
    <div className="flex h-full flex-col">
      {/* Секция «Рост»: бары от оси вправо. */}
      <div className={SECTION_CLASS}>
        <Skeleton height="10px" width="48px" />

        {Array.from({ length: SECTION_ROW_COUNT }, (_, index) => GROWTH_BAR_WIDTHS[index]).map((barWidth, index) => {
          const rowNode = (
            <div key={index} className={ROW_CLASS}>
              <Skeleton height="10px" width="72px" />

              <div className={BAR_ZONE_CLASS}>
                <div className={AXIS_CLASS} />

                <div
                  className="absolute top-1/2 -translate-y-1/2"
                  style={{ left: "50%", width: barWidth }}
                >
                  <Skeleton height="14px" borderRadius="4px" />
                </div>
              </div>

              <Skeleton height="8px" width="36px" />
            </div>
          );

          return rowNode;
        })}
      </div>

      <div className="my-2 border-t border-border" />

      {/* Секция «Падение»: бары от оси влево. */}
      <div className={SECTION_CLASS}>
        <Skeleton height="10px" width="56px" />

        {Array.from({ length: SECTION_ROW_COUNT }, (_, index) => DECLINE_BAR_WIDTHS[index]).map((barWidth, index) => {
          const rowNode = (
            <div key={index} className={ROW_CLASS}>
              <Skeleton height="10px" width="72px" />

              <div className={BAR_ZONE_CLASS}>
                <div className={AXIS_CLASS} />

                <div
                  className="absolute top-1/2 -translate-y-1/2"
                  style={{ right: "50%", width: barWidth }}
                >
                  <Skeleton height="14px" borderRadius="4px" />
                </div>
              </div>

              <Skeleton height="8px" width="36px" />
            </div>
          );

          return rowNode;
        })}
      </div>
    </div>
  );
}
