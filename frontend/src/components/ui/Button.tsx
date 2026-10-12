"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";

/** Высота кнопок тулбара по макету (.pill-group, 29px). */
const HEIGHT_CLASS = "h-[29px]";

/** Класс активной кнопки (макет .pill-group button.active: светло-голубая
    заливка --accent-surface, акцентные рамка и текст). */
const ACTIVE_CLASS =
  "inline-flex items-center justify-center rounded-md border border-accent bg-accent-surface px-3 text-xs font-medium text-accent";

/** Класс обычной кнопки (макет .pill-group button: прозрачный фон, рамка
    border, вторичный текст; hover — акцентная рамка). */
const IDLE_CLASS =
  "inline-flex items-center justify-center rounded-md border border-border px-3 text-xs font-medium text-text-secondary hover:border-accent";

/**
 * Тип props Button — базовая кнопка тулбара: единый вид для пресетов
 * периода, выбора сегмента и триггера «Произвольный период» (макет
 * .pill-group). Остальные props (id, role, aria-*, tabIndex, события)
 * пробрасываются на элемент: группы навешивают radio-семантику и roving
 * tabindex, триггер пикера living внутри <button> Popover.
 */
type ButtonProps = {
  /** Активное состояние (светло-голубая заливка, акцентные рамка/текст). */
  isActive: boolean;
  /** Содержимое кнопки (подпись). */
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<"span">, "children" | "className">;

/**
 * Button — базовая кнопка тулбара (макет .pill-group): пилюля с рамкой;
 * активная — светло-голубая заливка с акцентными рамкой и текстом.
 * Рендерит span, а не <button>: группы (ButtonGroup) навешивают на него
 * radio-семантику, а триггер пикера вкладывается в <button> Popover —
 * вложенные кнопки недопустимы.
 *
 * @param props активность, содержимое, прочие span-props.
 * @returns кнопку тулбара.
 */
export function Button({ isActive, children, ...rest }: ButtonProps) {
  const stateClass = isActive ? ACTIVE_CLASS : IDLE_CLASS;

  return (
    <span
      className={`${HEIGHT_CLASS} cursor-pointer inline-flex items-center gap-1.5 ${stateClass}`}
      {...rest}
    >
      {children}
    </span>
  );
}
