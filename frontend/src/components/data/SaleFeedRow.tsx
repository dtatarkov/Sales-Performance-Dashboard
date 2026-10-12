"use client";

import { SaleStatusBadge } from "./SaleStatusBadge";
import { SaleFeedLine } from "./SaleFeedLine";
import { formatDateTime } from "../../formatters/formatDate";
import type { SaleFeedItem } from "../../types/dashboard";

/** Класс первой линии строки ленты: клиент · менеджер · дата + бейдж. */
const FEED_ROW_HEAD_CLASS = "flex items-center justify-between gap-3";

/** Класс группы «клиент · менеджер · дата». */
const FEED_ROW_META_CLASS = "flex min-w-0 items-baseline gap-2 text-sm";

/**
 * SaleFeedRow — строка ленты сделок (ui.md, блок 9): первая линия — клиент,
 * менеджер, дата и статус-бейдж; вторая — SaleFeedLine (товары · сумма · ВП).
 * Виджету остаётся только перечислить строки.
 *
 * @param props сделка.
 * @returns строка ленты.
 */
export function SaleFeedRow({ sale }: { sale: SaleFeedItem }) {
  const dateTimeLabel = formatDateTime(sale.date);

  return (
    <div className="flex flex-col gap-1 border-b border-border pb-3">
      <div className={FEED_ROW_HEAD_CLASS}>
        <span className={FEED_ROW_META_CLASS}>
          <span className="truncate font-medium text-text-primary">
            {sale.client}
          </span>

          <span className="truncate text-text-secondary">
            · {sale.manager}
          </span>

          <span className="shrink-0 tabular-nums text-text-tertiary">
            · {dateTimeLabel}
          </span>
        </span>

        <SaleStatusBadge status={sale.status} />
      </div>

      <SaleFeedLine
        itemsCount={sale.itemsCount}
        revenue={sale.revenue}
        gp={sale.gp}
      />
    </div>
  );
}