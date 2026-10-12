"use client";

import { Toaster as SonnerToaster } from "sonner";

/** Позиция тостов (ui.md, этап 8). */
const TOASTER_POSITION = "top-center";

/** Одновременно видимых тостов. */
const VISIBLE_TOASTS = 2;

/**
 * Стиль тоста — утверждённый макет docs/archive/toast-notification.html (стиль
 * 9–10): белая поверхность, нейтральный бордер, габариты и тень — из
 * docs/archive/dashboard-states.html (.toast); ширина — по содержимому. Тост
 * центрируется left/right: 0 + авто-маргинами: transform занят анимацией
 * sonner (подъём стека), left/right перекрывают их отсутствие в его CSS.
 */
const TOAST_STYLE = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
  padding: "6px 10px",
  minHeight: "32px",
  fontSize: "12px",
  gap: "8px",
  width: "fit-content",
  maxWidth: "calc(100vw - 32px)",
  left: 0,
  right: 0,
  marginLeft: "auto",
  marginRight: "auto",
  boxShadow: "0 6px 18px rgba(0, 0, 0, 0.1)",
} as const;

/**
 * Стиль кнопки действия («Обновить») — утверждённый макет
 * docs/archive/toast-notification.html (вариант 1): контурная красная.
 * Заливка при наведении — app/globals.css, [data-button]:hover.
 */
const TOAST_ACTION_BUTTON_STYLE = {
  height: "auto",
  margin: "0 0 0 4px",
  padding: "3px 9px",
  fontSize: "11px",
  fontWeight: "500",
  lineHeight: "1.25",
  borderRadius: "5px",
  background: "transparent",
  border: "1px solid var(--danger-outline)",
  color: "var(--danger-strong)",
} as const;

/**
 * Toaster — точка настройки `<Toaster>` sonner (frontend-plan.md, этап 6):
 * единственный импорт sonner вне widgets/toasts. Позиция/тема задаются здесь;
 * виджет toasts вызывает только toast.*-функции.
 *
 * @returns настроенная точка рендера тостов.
 */
export function Toaster() {
  const toastOptions = {
    style: TOAST_STYLE,
    actionButtonStyle: TOAST_ACTION_BUTTON_STYLE,
  } as const;

  return (
    <SonnerToaster
      position={TOASTER_POSITION}
      visibleToasts={VISIBLE_TOASTS}
      toastOptions={toastOptions}
    />
  );
}