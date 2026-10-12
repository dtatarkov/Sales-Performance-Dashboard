"use client";

import { ContributionBar } from "./ContributionBar";
import { MetricsGrid, type MetricsGridCell } from "./MetricsGrid";
import { RankBadge } from "../ui/RankBadge";
import type { Contribution } from "../../types/contribution";

/**
 * Тип props RankedRow — универсальная строка ранжированного списка
 * (ui.md, блоки 2/4/8): позиция на цветном маркере, имя + контекст, вклад
 * справа, сетка метрик уровня 2 под строкой.
 */
type RankedRowProps = {
  /** Позиция в списке (1-based). */
  position: number;
  /** CSS-цвет фона маркера позиции (палитра серии или цвет категории). */
  markerColor: string;
  /** Имя строки. */
  title: string;
  /** Контекстная строка под именем (команда · продажи, SKU · категория). */
  contextLine: string;
  /** Вклад активного датасета (готовый, с сервера). */
  contribution: Contribution;
  /** Единица крупного значения: money (₽) или счётчик (шт). */
  valueUnit: "money" | "count";
  /** Индекс активного датасета (цвет серии бара). */
  seriesIndex: number;
  /** Поля сетки уровня 2. */
  cells: MetricsGridCell[];
  /** Число колонок сетки уровня 2 (рейтинг/клиенты — 3, продукты — 5). */
  columns: number;
};

/** Класс строки-контейнера (макет .lb-row/.tp-item: разделитель снизу;
    pt-4 — зазор от разделителя предыдущей строки, pb-4 — до своего;
    у последней строки разделителя нет — макет .lb-row:last-child). */
const ROW_CLASS =
  "flex flex-col gap-2 border-b border-border pb-4 pt-4 last:border-b-0";

/** Класс строки уровня 1 (макет .lb-row-top/.tp-line1). */
const TOP_CLASS = "flex items-center gap-3";

/** Класс блока имени и контекста. */
const NAME_CLASS = "min-w-0 flex-1";

/** Класс имени (макет .lb-name: 13px, semibold, ellipsis). */
const TITLE_CLASS = "block truncate text-sm font-medium text-text-primary";

/** Класс контекстной строки (макет .lb-line2: 11px, вторичный, ellipsis). */
const CONTEXT_CLASS = "block truncate text-xs text-text-tertiary";

/**
 * RankedRow — универсальная строка рейтинга/топа (ui.md, блоки 2/4/8):
 * уровень 1 — маркер позиции (RankBadge: цифра на цветном фоне — общий
 * стиль трёх списков по макету .lb-pos-dot), имя с контекстной строкой,
 * вклад справа (ContributionBar); уровень 2 — сетка метрик (MetricsGrid).
 * Специфика блока (цвет маркера, контекст, набор метрик) приходит через
 * props.
 *
 * @param props позиция, цвет маркера, имя, контекст, вклад, серия, метрики.
 * @returns строку ранжированного списка.
 */
export function RankedRow({
  position,
  markerColor,
  title,
  contextLine,
  contribution,
  valueUnit,
  seriesIndex,
  cells,
  columns,
}: RankedRowProps) {
  const nameNode = (
    <span className={NAME_CLASS}>
      <span className={TITLE_CLASS}>{title}</span>

      <span className={CONTEXT_CLASS}>{contextLine}</span>
    </span>
  );

  return (
    <div className={ROW_CLASS}>
      <div className={TOP_CLASS}>
        <RankBadge
          position={position}
          color={markerColor}
        />

        {nameNode}

        <ContributionBar
          contribution={contribution}
          valueUnit={valueUnit}
          seriesIndex={seriesIndex}
        />
      </div>

      <MetricsGrid cells={cells} columns={columns} />
    </div>
  );
}