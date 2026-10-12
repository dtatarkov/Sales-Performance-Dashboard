"use client";

import { RankedRow } from "./RankedRow";
import { paletteColorOf } from "../../configuration/colorPalette";
import { formatMoney } from "../../formatters/formatMoney";
import { formatNumber } from "../../formatters/formatNumber";
import { formatPercent } from "../../formatters/formatPercent";
import { plural } from "../../utils/plural";
import type { CustomerTopItem } from "../../types/dashboard";

/**
 * Контекстная строка клиента: «клиент с 2023 · 18 заказов» (ui.md, блок 4).
 *
 * @param item строка топ-клиентов.
 * @returns готовая строка контекста.
 */
function contextLineOf(item: CustomerTopItem): string
{
  const orderLabel = plural(item.orderCount, "заказ", "заказа", "заказов");
  const sinceLabel = `клиент с ${item.since}`;
  const ordersLabel = `${formatNumber(item.orderCount)} ${orderLabel}`;

  const line = `${sinceLabel} · ${ordersLabel}`;

  return line;
}

/**
 * Строка топ-клиентов (ui.md, блок 4): уровень 1 — маркер позиции (цифра
 * на цветном фоне), имя + контекст «клиент с 2023 · 18 заказов», бар +
 * значение+вклад; уровень 2 — сетка из 6 метрик со своими Δ.
 */
type CustomerTopRowProps = {
  /** Позиция в списке (1-based). */
  position: number;
  /** Строка активного датасета. */
  item: CustomerTopItem;
  /** Индекс активного датасета (цвет серии). */
  seriesIndex: number;
};

/**
 * CustomerTopRow — строка топ-клиентов (ui.md, блок 4) на базе RankedRow:
 * маркер позиции — цифра на фоне палитры (индекс = позиция − 1), контекст —
 * «клиент с 2023 · 18 заказов», вклад — contribution активного датасета
 * (готовые значения).
 *
 * @param props позиция, строка, серия.
 * @returns строку топа клиентов.
 */
export function CustomerTopRow({ position, item, seriesIndex }: CustomerTopRowProps) {
  const contextLine = contextLineOf(item);

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
      label: "Возвраты",
      value: item.refundRate === null ? null : formatPercent(item.refundRate),
      delta: item.refundRateDelta,
      negative: true,
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
