"use client";

import type { ReactNode } from "react";
import type { Color } from "../../types/color";

/**
 * Тип props примитива Badge: статус-бейдж и база Δ-бейджа
 * (frontend-plan.md, этап 6). Цвет — семантика Color; размер и содержание —
 * на совести вызывающего.
 */
type BadgeProps = {
  /** Семантика цвета (типы/color.ts). */
  color: Color;
  /** Содержимое бейджа (текст или число). */
  children: ReactNode;
  /** Заголовок (tooltip нативный; точный tooltip — примитив Tooltip). */
  title?: string;
  /** Доп. классы вызывающего (ширина/центрирование у статус-бейджа). */
  className?: string;
};

/** Словарь семантического цвета в CSS-цвета (токены globals.css). */
const COLOR_STYLES: Record<Color, { background: string; color: string }> = {
  neutral: { background: "var(--border)", color: "var(--text-secondary)" },
  positive: { background: "color-mix(in srgb, var(--success) 14%, white)", color: "var(--success)" },
  negative: { background: "color-mix(in srgb, var(--danger) 14%, white)", color: "var(--danger)" },
};

/**
 * Примитив Badge — статус-бейдж и база Δ-бейджа (frontend-plan.md, этап 6):
 * скруглённая плашка с фоном семантического цвета. Размер фикс. по макету
 * `.badge` (одинаков для всех статусов, текст отцентрован — inline-flex
 * justify-center); семантика «хорошо/плохо» решается вызывающим (виджет
 * знает семантику метрики, ui.md, «Цвет Δ»).
 *
 * @param props цвет и содержимое.
 * @returns плашку-бейдж.
 */
export function Badge({ color, children, title, className = "" }: BadgeProps) {
  const colorStyles = COLOR_STYLES[color];

  const badgeStyle = {
    backgroundColor: colorStyles.background,
    color: colorStyles.color,
  } as const;

  const badgeClassName =
    `inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none whitespace-nowrap ${className}`;

  return (
    <span className={badgeClassName} style={badgeStyle} title={title}>
      {children}
    </span>
  );
}