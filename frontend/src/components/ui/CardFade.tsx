"use client";

/** Класс overlay-градиента: поверх контента, без перехвата скролла. */
const FADE_CLASS_NAME =
  "pointer-events-none absolute inset-x-0 bottom-0 h-8";

/** Стиль градиента (токен globals.css). */
const FADE_STYLE = {
  background: "linear-gradient(to top, var(--surface), transparent)",
} as const;

/**
 * CardFade — overlay-градиент внизу карточки (ui.md, «Скролл внутри
 * карточки»): маркер продолжения списка. Абсолютное позиционирование —
 * место в потоке не резервируется; pointer-events нет, чтобы не блокировать
 * скролл под градиентом.
 *
 * @returns fade-overlay.
 */
export function CardFade() {
  return <div aria-hidden className={FADE_CLASS_NAME} style={FADE_STYLE} />;
}