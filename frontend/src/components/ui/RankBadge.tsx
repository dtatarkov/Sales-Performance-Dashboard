"use client";

/**
 * Тип props примитива RankBadge — маркер строки ранжированного списка
 * (ui.md, блоки 2/4/8; макет .lb-pos-dot > .lb-cmark): цифровой индекс
 * позиции на цветном фоне. Общий стиль трёх списков (менеджеры, клиенты,
 * продукты) — различается только цвет фона.
 */
type RankBadgeProps = {
  /** Позиция в списке (1-based, печатается как есть). */
  position: number;
  /** CSS-цвет фона (палитра серии или цвет категории). */
  color: string;
};

/** Класс бейджа (макет .lb-cmark: 24×24, радиус 6, белый текст 10px bold). */
const BADGE_CLASS =
  "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white";

/**
 * RankBadge — квадратный маркер 24×24 с номером позиции на цветном фоне.
 * Цвет фона передаёт вызывающий: все три списка — палитра по позиции
 * (цвет закреплён за позицией, не «прыгает» при смене метрики; README,
 * «UI-правила»).
 *
 * @param props позиция и цвет фона.
 * @returns бейдж позиции.
 */
export function RankBadge({ position, color }: RankBadgeProps) {
  const badgeStyle = { backgroundColor: color } as const;

  return (
    <span
      className={BADGE_CLASS}
      style={badgeStyle}
      aria-label={`Место ${position}`}
    >
      {position}
    </span>
  );
}
