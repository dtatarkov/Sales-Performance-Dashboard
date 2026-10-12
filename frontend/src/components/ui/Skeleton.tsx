"use client";

import type { CSSProperties } from "react";

/**
 * Тип props примитива Skeleton: форма задаётся children-композицией либо
 * явными размерами (строки/блоки), анимация pulse — встроенная.
 */
type SkeletonProps = {
  /** Ширина блока (CSS-размер, по умолчанию 100%). */
  width?: string;
  /** Высота блока (CSS-размер). */
  height?: string;
  /** Скругление (по умолчанию token border-radius 6px). */
  borderRadius?: string;
  /** Дочерний контент не поддерживается — skeleton это пустой блок. */
  children?: never;
};

/**
 * Примитив skeleton — «серый пульсирующий блок» (frontend-plan.md, этап 6;
 * ui.md, «Initial loading»): skeleton по форме контента собирается в
 * skeleton-компонентах блоков из нескольких Skeleton с явными размерами.
 *
 * Стили inline через CSSProperties — размеры передаются строками, чтобы
 * skeleton-композиции не плодили Tailwind-классы.
 *
 * @param props ширина/высота/скругление.
 * @returns пульсирующий блок-заглушка.
 */
export function Skeleton({
  width = "100%",
  height = "12px",
  borderRadius = "6px",
}: SkeletonProps) {
  const skeletonStyle: CSSProperties = {
    width,
    height,
    borderRadius,
    backgroundColor: "var(--border)",
    animation: "skeleton-pulse 1.6s ease-in-out infinite",
  };

  return <div style={skeletonStyle} aria-hidden />;
}