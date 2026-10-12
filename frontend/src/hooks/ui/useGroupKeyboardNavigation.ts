"use client";

import type { KeyboardEvent } from "react";

/**
 * Аргументы useGroupKeyboardNavigation.
 */
type GroupKeyboardNavigationArgs<TValue extends string> = {
  /** Значения опций группы в порядке следования DOM (порядок стрелок). */
  values: readonly TValue[];
  /** Текущее значение или null (группа без выбора — фокус на первой опции). */
  value: TValue | null;
  /** Смена значения стрелками; хук всегда передаёт валидное значение опции. */
  onChange: (value: TValue) => void;
  /** Префикс DOM id опций — тот же, из которого строится атрибут id элемента. */
  domIdPrefix: string;
};

/**
 * Возврат useGroupKeyboardNavigation: опоры roving tabindex для группы.
 */
type GroupKeyboardNavigation<TValue extends string> = {
  /** Опция, которой достаётся фокус при входе в группу (не −1 в tabIndex). */
  focusedValue: TValue | null;
  /** DOM id опции — единый формат с focusOption внутри хука. */
  elementIdOf: (value: TValue) => string;
  /** Обработчик onKeyDown опции: стрелки переключают значение и фокус. */
  handleKeyDown: (event: KeyboardEvent<HTMLElement>, optionValue: TValue) => void;
};

/**
 * Клавиатурная навигация группы «ровно один выбран» (hooks/ui): roving
 * tabindex — фокус на выбранной опции (или первой, если выбора нет), стрелки
 * право/вниз и лево/вверх зацикленно переключают значение и переносят фокус
 * (макеты .pill-group/.seg; frontend.md, раздел 6). DOM id опции строится из
 * префикса: `<domIdPrefix>-<value>` — компонент обязан проставить элементу
 * id через elementIdOf, иначе перенос фокуса не найдёт цель.
 *
 * @param args значения опций по порядку, текущее значение, смена значения, префикс id.
 * @returns focusedValue для tabIndex, elementIdOf для атрибута id, handleKeyDown.
 */
export function useGroupKeyboardNavigation<TValue extends string>({
  values,
  value,
  onChange,
  domIdPrefix,
}: GroupKeyboardNavigationArgs<TValue>): GroupKeyboardNavigation<TValue>
{
  const elementIdOf = (optionValue: TValue): string =>
    `${domIdPrefix}-${optionValue}`;

  const focusOption = (optionValue: TValue): void => {
    document.getElementById(elementIdOf(optionValue))?.focus();
  };

  // Roving tabindex: фокус на выбранной; если ничего не выбрано — на первой.
  const focusedValue =
    value !== null && values.includes(value) ? value : values[0] ?? null;

  const handleKeyDown = (
    event: KeyboardEvent<HTMLElement>,
    optionValue: TValue,
  ): void => {
    const currentIndex = values.indexOf(optionValue);

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();

      const next = values[(currentIndex + 1) % values.length];

      onChange(next);
      focusOption(next);
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();

      const previous = values[(currentIndex - 1 + values.length) % values.length];

      onChange(previous);
      focusOption(previous);
    }
  };

  return { focusedValue, elementIdOf, handleKeyDown };
}
