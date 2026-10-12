"use client";

import { RankedRow } from "./RankedRow";
import { formatMoney } from "../../formatters/formatMoney";
import { formatNumber } from "../../formatters/formatNumber";
import { formatPercent } from "../../formatters/formatPercent";
import type { ProductItem } from "../../types/dashboard";

/**
 * Строка лучших продуктов (ui.md, блок 8): уровень 1 — маркер позиции
 * (цифра на цветном фоне — палитра по позиции), название + SKU·Категория,
 * бар+значение+вклад; уровень 2 — сетка из 5 полей: Выручка, ВП, Продано,
 * Маржинальность, Возвраты.
 */
type ProductTopRowProps = {
  /** Позиция в списке (1-based). */
  position: number;
  /** Строка активного датасета. */
  item: ProductItem;
  /** Индекс активного датасета (цвет серии: 1-й синий, 2-й зелёный, 3-й оранжевый). */
  seriesIndex: number;
  /** Цвет маркера позиции (фон бейджа; палитра по позиции — решение уровня дашборда, README «UI-правила»). */
  markerColor: string;
};

/**
 * ProductTopRow — строка топа продуктов (ui.md, блок 8) на базе RankedRow:
 * маркер позиции — цифра на фоне цвета позиции (палитра по индексу — цвет
 * закреплён за позицией, не за товаром), контекст — «SKU · Категория»,
 * вклад — contribution активного датасета. Отрицательная ВП у лидера: бар
 * нулевой (valueNormalized ≤ 0), значение печатается как есть.
 *
 * @param props позиция, строка, серия, цвет маркера.
 * @returns строку топа продуктов.
 */
export function ProductTopRow({
  position,
  item,
  seriesIndex,
  markerColor,
}: ProductTopRowProps) {
  const contextLine = `${item.sku} · ${item.category}`;

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
      label: "Продано",
      value: formatNumber(item.units),
      delta: item.unitsDelta,
    },
    {
      label: "Маржинальность",
      value: item.margin === null ? null : formatPercent(item.margin),
      delta: item.marginDelta,
    },
    {
      label: "Возвраты",
      value: item.refundRate === null ? null : formatPercent(item.refundRate),
      delta: item.refundRateDelta,
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
      columns={5}
    />
  );
}