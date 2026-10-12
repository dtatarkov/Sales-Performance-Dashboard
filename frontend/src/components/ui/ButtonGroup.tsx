"use client";

import { Button } from "./Button";
import { useGroupKeyboardNavigation } from "../../hooks/ui/useGroupKeyboardNavigation";

/** Класс контейнера группы (макет .pill-group: ряд кнопок, зазор 4px). */
const GROUP_CLASS = "inline-flex items-center gap-1";

/**
 * Тип props ButtonGroup — группа кнопок-радио на базовой Button (макет
 * .pill-group): пресеты периода и выбор сегмента. Семантика «один или ни
 * одного»: повторный клик по выбранной кнопке при allowDeselect снимает
 * выбор (onChange(null)).
 */
type ButtonGroupProps<TValue extends string> = {
  /** Опции группы (значение + подпись). */
  options: readonly { value: TValue; label: string }[];
  /** Текущее значение или null (ничего не выбрано). */
  value: TValue | null;
  /** Смена значения; null — снятие выбора повторным кликом. */
  onChange: (value: TValue | null) => void;
  /** Повторный клик по выбранной кнопке снимает выбор. */
  allowDeselect: boolean;
  /** Aria-метка группы. */
  ariaLabel: string;
};

/**
 * ButtonGroup — группа кнопок-радио на базовой Button (frontend-plan.md,
 * этап 6): radio-семантика (radiogroup + radio), roving tabindex — фокус на
 * выбранной (или первой), стрелки переключают значение и фокус.
 * Все константы/классы — на уровне модуля (AGENTS.md, «Стиль JSX»).
 *
 * @param props опции, значение, события, deselect, aria-метка.
 * @returns группу кнопок.
 */
export function ButtonGroup<TValue extends string>({
  options,
  value,
  onChange,
  allowDeselect,
  ariaLabel,
}: ButtonGroupProps<TValue>) {
  // Roving tabindex и стрелки — общая механика группы (hooks/ui).
  const { focusedValue, elementIdOf, handleKeyDown } =
    useGroupKeyboardNavigation({
      values: options.map((option) => option.value),
      value,
      onChange,
      domIdPrefix: `button-group-${ariaLabel}`,
    });

  return (
    <span role="radiogroup" aria-label={ariaLabel} className={GROUP_CLASS}>
      {options.map((option) => {
        const isSelected = option.value === value;
        const isFocusable = option.value === focusedValue;

        const handleClick = () => {
          if (isSelected && allowDeselect) {
            onChange(null);

            return;
          }

          onChange(option.value);
        };

        return (
          <Button
            key={option.value}
            id={elementIdOf(option.value)}
            role="radio"
            aria-checked={isSelected}
            tabIndex={isFocusable ? 0 : -1}
            isActive={isSelected}
            onClick={handleClick}
            onKeyDown={(event) => handleKeyDown(event, option.value)}
          >
            {option.label}
          </Button>
        );
      })}
    </span>
  );
}
