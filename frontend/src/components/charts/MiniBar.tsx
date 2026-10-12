"use client";

import { useTransitionValue } from "../../hooks/ui/useTransitionValue";
import { CHART_ANIMATION } from "../../configuration/charts";

/**
 * Тип props MiniBar — геометрия мини-бара (макеты .loss-bar-wrap/.dyn-bar):
 * трек фиксированного размера, заливка — длина в процентах.
 */
type MiniBarProps = {
  /** Ширина трека, px. */
  width: number;
  /** Высота трека, px. */
  height: number;
  /** Радиус скругления трека и заливки, px. */
  radius: number;
  /** Длина заливки, 0–100 (% ширины трека). */
  value: number;
  /** CSS-цвет заливки. */
  color: string;
  /** Прозрачность заливки, 0–1 (макет .loss-bar: 0.75). */
  opacity?: number;
  /** Подложка трека; false — трек без фона (пустой хвост). */
  track?: boolean;
};

/**
 * MiniBar — примитив «трек с заливкой» (ui-слой): маленький горизонтальный
 * бар для строк списков — топ потерь (60×12, danger, opacity .75), дивергентная
 * динамика (половина зоны, семантический цвет). Длина заливки анимируется
 * единой длительностью чартов (CHART_ANIMATION): при смене данных бар
 * перетекает в новую длину, а не прыгает (ui.md, «Анимации»). Переход —
 * строго prev → current: значение подставляется через useTransitionValue
 * (кадром позже commit), браузер гарантированно фиксирует prev-ширину.
 * Заливка — block: inline-элемент игнорирует width/height, бар схлопывается
 * в ноль.
 *
 * @param props геометрия трека, длина и цвет заливки.
 * @returns трек с анимированной заливкой.
 */
export function MiniBar({
  width,
  height,
  radius,
  value,
  color,
  opacity = 1,
  track = true,
}: MiniBarProps) {
  // Двухфазное значение: рендер остаётся на prev-длине, целевая подставляется
  // кадром позже — transition проигрывается без стартового прыжка.
  const displayedValue = useTransitionValue(value);

  const clampedValue = Math.max(displayedValue, 0);

  const trackStyle = {
    width: `${width}px`,
    height: `${height}px`,
    borderRadius: `${radius}px`,
  } as const;

  const fillStyle = {
    width: `${clampedValue}%`,
    backgroundColor: color,
    opacity,
  } as const;

  return (
    <span
      className={`block shrink-0 overflow-hidden ${track ? "bg-track" : ""}`}
      style={trackStyle}
    >
      <span
        className={`block h-full transition-[width] ${CHART_ANIMATION.durationClass}`}
        style={{ ...fillStyle, borderRadius: `${radius}px`, transitionTimingFunction: CHART_ANIMATION.easing }}
      />
    </span>
  );
}
