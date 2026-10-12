"use client";

/**
 * Тип props SaleFeedLine — вторая линия строки ленты сделок (ui.md, блок 9):
 * товары · сумма · валовая прибыль. ВП печатается только для paid (ui.md:
 * причина для возврата/отмены — вместо ВП).
 */
type SaleFeedLineProps = {
  /** Число товаров в сделке. */
  itemsCount: number;
  /** Сумма сделки. */
  revenue: number;
  /** Валовая прибыль или null (не печатается). */
  gp: number | null;
};

/** Класс второй линии строки ленты. */
const FEED_LINE_CLASS = "text-xs tabular-nums text-text-secondary";

/** Локальное денежное форматирование ленты (сокращения тыс/млн). */
function formatFeedMoney(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    const millions = value / 1_000_000;

    return `${millonsLabel(millions)} млн ₽`;
  }

  if (Math.abs(value) >= 1_000) {
    return `${Math.round(value / 1_000)} тыс ₽`;
  }

  return `${value} ₽`;
}

/** Формат млн с запятой и без хвостовых нулей. */
function millonsLabel(millions: number): string {
  return millions.toFixed(2).replace(".", ",").replace(/,?0+$/, "");
}

/**
 * SaleFeedLine — вторая линия строки ленты сделок (ui.md, блок 9):
 * «2 товара · Сумма 12 тыс ₽ · Валовая прибыль 3,4 тыс ₽».
 *
 * @param props число товаров, сумма, валовая прибыль.
 * @returns строка второй линии.
 */
export function SaleFeedLine({ itemsCount, revenue, gp }: SaleFeedLineProps) {
  const itemsWord = itemsCount === 1
    ? "товар"
    : itemsCount < 5
      ? "товара"
      : "товаров";

  const itemsLabel = `${itemsCount} ${itemsWord}`;

  const revenueLabel = formatFeedMoney(revenue);

  if (gp === null) {
    const line = `${itemsLabel} · Сумма ${revenueLabel}`;

    return <span className={FEED_LINE_CLASS}>{line}</span>;
  }

  const gpLabel = formatFeedMoney(gp);

  const line = `${itemsLabel} · Сумма ${revenueLabel} · Валовая прибыль ${gpLabel}`;

  return <span className={FEED_LINE_CLASS}>{line}</span>;
}