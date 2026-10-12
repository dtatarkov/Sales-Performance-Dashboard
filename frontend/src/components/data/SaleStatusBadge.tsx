"use client";

import { Badge } from "../ui/Badge";
import { Tooltip } from "../ui/Tooltip";
import type { SaleStatus } from "../../types/saleStatus";
import type { Color } from "../../types/color";

/** Отображение статуса сделки: подпись, цвет, объяснение «как посчитано». */
type StatusView = {
  label: string;
  color: Color;
  /** Подсказка тултипа (domain.md, матрица статусов). */
  explanation: string;
};

/**
 * Словарь статусов ленты продаж (ui.md, блок 9): подпись бейджа, цвет и
 * tooltip «как посчитано» (domain.md — матрица статусов продажи).
 * Цвет — семантика Color: оплачена — положительный, возврат — отрицательный,
 * отмена — нейтральный.
 */
const STATUS_VIEWS: Record<SaleStatus, StatusView> = {
  paid: {
    label: "Выполнена",
    color: "positive",
    explanation:
      "Сделка оплачена: сумма и валовая прибыль включены в метрики периода оплаты",
  },
  refunded: {
    label: "Возврат",
    color: "negative",
    explanation:
      "Оплаченная сделка возвращена: сумма исключена из выручки и ВП периода возврата; в блоке «Возвраты» учтена по дате возврата",
  },
  cancelled: {
    label: "Отменена",
    color: "neutral",
    explanation:
      "Сделка отменена до оплаты: в выручке и ВП не участвует; в блоке «Отмены» учтена по дате отмены",
  },
};

/**
 * Статус-бейдж сделки ленты (ui.md, блок 9): цвет по статусу + tooltip
 * «как посчитано» (domain.md, матрица статусов). Ширина и центрирование —
 * по макету .sale-badge: подписи разной длины читаются одинаковыми плашками.
 *
 * @param status статус сделки.
 * @returns бейдж с тултипом.
 */
export function SaleStatusBadge({ status }: { status: SaleStatus }) {
  const view = STATUS_VIEWS[status];

  const badgeClassName = "min-w-[84px] text-center";

  return (
    <Tooltip content={view.explanation}>
      <Badge color={view.color} className={badgeClassName}>
        {view.label}
      </Badge>
    </Tooltip>
  );
}