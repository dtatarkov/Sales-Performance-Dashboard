"use client";

import { useId, useState, type ReactNode } from "react";
import {
  useFloating,
  useHover,
  useFocus,
  useInteractions,
  useRole,
  offset,
  flip,
  shift,
  autoUpdate,
} from "@floating-ui/react";

/**
 * Тип props Tooltip — примитив тултипа (frontend-plan.md, этап 6;
 * frontend.md §7: hover-логика + позиционирование @floating-ui/react-dom —
 * flip/shift/offset, autoUpdate следит за скроллом внутри списков).
 */
type TooltipProps = {
  /** Содержимое тултипа (текст или верстка «как посчитано»). */
  content: ReactNode;
  /** Элемент-триггер (обычно текст/бейдж). */
  children: ReactNode;
  /** Смещение от триггера, px. */
  offsetPx?: number;
};

/* eslint-disable react-hooks/refs -- refs и floatingStyles — публичный
   контракт @floating-ui/react: библиотека возвращает значения для применения
   в render (docs: "Apply the floating styles"), это не «чтение ref.current»
   в пользовательском смысле. */

/**
 * Tooltip — hover/focus → плавающая подсказка (frontend-plan.md, этап 6).
 * autoUpdate обновляет позицию при скролле списков внутри карточек —
 * тултип не «отрывается» от триггера. Видимость управляется state (open),
 * стиль invisible — до первого hover.
 *
 * @param props содержимое, триггер, смещение.
 * @returns триггер с тултипом.
 */
export function Tooltip({ content, children, offsetPx = 6 }: TooltipProps) {
  const tooltipId = useId();
  const [open, setOpen] = useState(false);

  const tooltip = useFloating({
    placement: "top",
    open,
    onOpenChange: setOpen,
    middleware: [offset(offsetPx), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  const hover = useHover(tooltip.context);
  const focus = useFocus(tooltip.context);
  const role = useRole(tooltip.context, { role: "tooltip" });

  // Прокинуть hover/focus-пропсы на reference и floating.
  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    role,
  ]);

  const tooltipClassName = open
    ? "visible z-50 max-w-64 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-primary shadow-md"
    : "invisible";

  return (
    <>
      <span
        ref={tooltip.refs.setReference}
        {...getReferenceProps()}
        aria-describedby={tooltipId}
        className="inline-flex cursor-help"
      >
        {children}
      </span>

      {open && (
        <span
          id={tooltipId}
          ref={tooltip.refs.setFloating}
          style={tooltip.floatingStyles}
          {...getFloatingProps()}
          className={tooltipClassName}
        >
          {content}
        </span>
      )}
    </>
  );
}