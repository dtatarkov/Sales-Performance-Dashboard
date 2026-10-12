"use client";

/* eslint-disable react-hooks/refs -- refs и floatingStyles — публичный
   контракт @floating-ui/react: библиотека возвращает значения для применения
   в render (docs: "Apply the floating styles"), это не «чтение ref.current»
   в пользовательском смысле. */

import { useEffect, useId, useRef, type ReactNode } from "react";
import {
  useFloating,
  useClick,
  useDismiss,
  useInteractions,
  offset,
  flip,
  shift,
} from "@floating-ui/react";

import { useDisclosure } from "../../hooks/ui/useDisclosure";

/**
 * Тип props Popover — поповер (frontend-plan.md, этап 6): открытие/закрытие
 * через useDisclosure, позиционирование @floating-ui/react-dom (flip/shift),
 * клик-вне + Escape → закрыть. База для DateRangePicker.
 */
type PopoverProps = {
  /** Триггер-элемент (кнопка открытия). */
  trigger: ReactNode;
  /** Содержимое поповера. */
  children: ReactNode;
  /** Ширина панели (CSS-размер; по умолчанию auto). */
  panelWidth?: string;
  /** Уведомление об открытии/закрытии панели (сброс незавершённого
      выбора пикера при закрытии без второго клика). */
  onOpenChange?: (open: boolean) => void;
};

/**
 * Popover — примитив поповера (frontend-plan.md, этап 6): клик по триггеру
 * открывает, клик вне и Escape закрывают. Позиция — bottom-start с flip/shift
 * (не вылезает за края вьюпорта).
 *
 * @param props триггер и содержимое.
 * @returns триггер + плавающая панель.
 */
export function Popover({
  trigger,
  children,
  panelWidth,
  onOpenChange,
}: PopoverProps) {
  const disclosure = useDisclosure();
  const popoverId = useId();

  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const { refs, floatingStyles, context } = useFloating({
    placement: "bottom-start",
    open: disclosure.isOpen,
    onOpenChange: (nextOpen) => {
      if (nextOpen)
      {
        disclosure.open();
      } else
      {
        disclosure.close();
      }

      onOpenChange?.(nextOpen);
    },
    middleware: [offset(6), flip(), shift({ padding: 8 })],
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    useClick(context),
    useDismiss(context),
  ]);

  // Подписка на outer-click/escape — через getFloatingProps (useDismiss
  // вешает слушатели на floating-элемент, поэтому панель должна быть в DOM
  // всегда; скрытие — через display, чтобы не терять слушатели).
  useEffect(() => {
    if (!disclosure.isOpen) {
      return;
    }

    const floatingElement = refs.floating.current;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      const insideTrigger = triggerRef.current?.contains(target) ?? false;
      const insidePanel = floatingElement?.contains(target) ?? false;

      if (!insideTrigger && !insidePanel) {
        disclosure.close();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        disclosure.close();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [disclosure, refs]);

  const panelStyle = {
    ...floatingStyles,
    display: disclosure.isOpen ? undefined : "none",
    ...(panelWidth !== undefined ? { width: panelWidth } : {}),
  } as const;

  return (
    <>
      <button
        ref={(node) => {
          triggerRef.current = node;
          refs.setReference(node);
        }}
        type="button"
        {...getReferenceProps()}
        aria-expanded={disclosure.isOpen}
        aria-controls={popoverId}
        className="inline-flex cursor-pointer"
      >
        {trigger}
      </button>

      <div
        id={popoverId}
        ref={refs.setFloating}
        style={panelStyle}
        {...getFloatingProps()}
        className="z-50 rounded-xl border border-border bg-surface shadow-lg"
      >
        {children}
      </div>
    </>
  );
}