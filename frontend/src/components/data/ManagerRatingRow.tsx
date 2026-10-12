"use client";

import { RankedRow } from "./RankedRow";
import { paletteColorOf } from "../../configuration/colorPalette";
import { formatMoney } from "../../formatters/formatMoney";
import { formatNumber } from "../../formatters/formatNumber";
import { formatPercent } from "../../formatters/formatPercent";
import { plural } from "../../utils/plural";
import type { ManagerRatingItem } from "../../types/dashboard";

/**
 * Строка рейтинга менеджеров (ui.md, блок 2): уровень 1 — маркер позиции
 * (цифра на цветном фоне вместо аватара по решению пользователя), имя +
 * команда/продажи, бар+значение+вклад; уровень 2 — сетка из 5 метрик со
 * своими Δ.
 */
type ManagerRatingRowProps = {
  /** Позиция в списке (1-based). */
  position: number;
  /** Строка активного датасета. */
  item: ManagerRatingItem;
  /** Индекс активного датасета (цвет серии). */
  seriesIndex: number;
};

/**
 * ManagerRatingRow — строка рейтинга (ui.md, блок 2) на базе RankedRow:
 * маркер позиции — цифра на фоне палитры (индекс цвета = позиция − 1;
 * цвет закреплён за строкой, не зависит от активной метрики), контекст —
 * «команда · N продаж», вклад — из contribution активного датасета.
 *
 * @param props позиция, строка, серия.
 * @returns строку рейтинга.
 */
export function ManagerRatingRow({ position, item, seriesIndex }: ManagerRatingRowProps) {
  const salesLabel = plural(item.salesCount, "продажа", "продажи", "продаж");

  const contextLine = `${item.team} · ${formatNumber(item.salesCount)} ${salesLabel}`;

  // Индекс цвета маркера — от позиции (0-based), а не от активного таба.
  const markerColor = paletteColorOf(position - 1);

  const cells = [
    {
      label: "Выручка",
      value: formatMoney(item.revenue),
      delta: item.revenueDelta,
    },
    {
      label: "Валовая прибыль",
      value: formatMoney(item.gp),
      delta: item.gpDelta,
    },
    {
      label: "Маржинальность",
      value: item.margin === null ? null : formatPercent(item.margin),
      delta: item.marginDelta,
    },
    {
      label: "Средний чек",
      value: formatMoney(item.ac),
      delta: item.acDelta,
    },
    {
      label: "Отмены",
      value: item.cancelRate === null ? null : formatPercent(item.cancelRate),
      delta: item.cancelRateDelta,
      negative: true,
    },
  ];

  return (
    <RankedRow
      position={position}
      markerColor={markerColor}
      title={item.name}
      contextLine={contextLine}
      contribution={item.contribution}
      valueUnit="money"
      seriesIndex={seriesIndex}
      cells={cells}
      columns={3}
    />
  );
}
