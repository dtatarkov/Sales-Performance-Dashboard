"use client";

import { DeltaText } from "./DeltaText";
import { MISSING_VALUE_MARKER } from "../../configuration/missingValueMarker";
import type { Delta } from "../../types/delta";

/**
 * Ячейка сетки уровня 2 (ui.md, блоки 2/4/8): подпись, значение, Δ.
 */
export type MetricsGridCell = {
  /** Подпись поля (капс). */
  label: string;
  /** Готовая строка значения; null — метрика не определена (пустой
      знаменатель/малая выборка) → один прочерк вместо значения и Δ. */
  value: string | null;
  /** Δ поля; null — «—» серым (DeltaText). */
  delta: Delta | null;
  /** «Плохая» метрика (возвраты/отмены): рост — красный. */
  negative?: boolean;
};

/**
 * Тип props MetricsGrid — сетка метрик уровня 2 строки рейтинга/топа
 * (ui.md, блоки 2/4/8): подпись → значение → Δ друг под другом;
 * число колонок задаёт вызывающий (рейтинг/клиенты — 3, продукты — 5,
 * макет .lb-l2/.tp-l2).
 */
type MetricsGridProps = {
  /** Поля сетки. */
  cells: MetricsGridCell[];
  /** Число колонок сетки. */
  columns: number;
};

/** Класс сетки уровня 2: колонки выровнены с заголовком элемента (имя
    менеджера/клиента/продукта), не с индексом — отступ = ширина маркера
    24px + зазор 12px = 36px (макет .lb-l2: pl-9). */
const GRID_CLASS = "grid gap-2 pl-9";

/** Класс подписи поля (макет .lb-l2-label: капс 10px, тертиарный). */
const LABEL_CLASS =
  "truncate text-[10px] font-medium uppercase tracking-wide text-text-tertiary";

/** Класс значения поля (макет .lb-l2-val: 12px, semibold). */
const VALUE_CLASS = "text-xs font-semibold tabular-nums text-text-primary";

/** Класс Δ поля (макет .lb-l2-delta: 11px, semibold). */
const DELTA_CLASS = "text-[11px] font-semibold";

/**
 * MetricsGrid — сетка «Выручка, ВП, Маржинальность, …» под строкой уровня 1
 * (ui.md, уровень 2): каждое поле — подпись, значение и Δ на отдельных
 * строках. Значения приходят готовыми строками (форматирование —
 * компонент-строка, не сетка).
 *
 * @param props поля сетки, число колонок.
 * @returns сетку метрик.
 */
export function MetricsGrid({ cells, columns }: MetricsGridProps) {
  const gridStyle = {
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
  } as const;

  return (
    <div className={GRID_CLASS} style={gridStyle}>
      {cells.map((cell) => {
        // Метрика не определена целиком (value === null) — один прочерк
        // вместо значения и Δ (ui.md, «Сквозные правила отображения чисел»:
        // прочерк — признак неопределённой метрики). null — контракт ячейки,
        // а не сравнение с выводом форматтера.
        const isCellMissing = cell.value === null;

        const cellNode = (
          <div key={cell.label} className="flex min-w-0 flex-col gap-0.5">
            <span className={LABEL_CLASS}>{cell.label}</span>

            {isCellMissing ? (
              <span className={VALUE_CLASS}>{MISSING_VALUE_MARKER}</span>
            ) : (
              <>
                <span className={VALUE_CLASS}>{cell.value}</span>

                <DeltaText
                  delta={cell.delta}
                  negative={cell.negative}
                  className={DELTA_CLASS}
                />
              </>
            )}
          </div>
        );

        return cellNode;
      })}
    </div>
  );
}