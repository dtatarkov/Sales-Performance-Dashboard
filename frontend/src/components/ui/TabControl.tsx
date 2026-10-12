"use client";

import { useGroupKeyboardNavigation } from "../../hooks/ui/useGroupKeyboardNavigation";

/** Контейнер табов (макет .seg: подложка --tab-surface). */
const GROUP_CLASS = "inline-flex items-center gap-0.5 rounded-lg bg-tab-surface p-0.5";

/** Высота табов по макету (29px), px. */
const HEIGHT_CLASS = "h-[29px]";

/** Класс выбранного таба (макет .seg button.active: белая поверхность,
    тёмный текст, лёгкая тень). */
const ACTIVE_CLASS =
  "inline-flex items-center justify-center rounded-md bg-surface px-2.5 text-xs font-medium text-text-primary shadow-sm";

/** Класс невыбранного таба (макет .seg button: прозрачный фон, вторичный
    текст; hover — основной текст). */
const IDLE_CLASS =
  "inline-flex items-center justify-center rounded-md px-2.5 text-xs font-medium text-text-secondary hover:text-text-primary";

/**
 * Тип props TabControl — контрол табов (frontend-plan.md, этап 6):
 * переключатель метрик в шапках блоков. Семантика «ровно один выбран» —
 * без снятия выбора; визуально и по коду не связан с кнопками тулбара
 * (Button/ButtonGroup): другой вид (подложка .seg) и своя логика.
 */
type TabControlProps<TValue extends string> = {
  /** Опции табов (значение + подпись). */
  options: readonly { value: TValue; label: string }[];
  /** Текущее значение (ровно один выбран). */
  value: TValue;
  /** Смена значения. */
  onChange: (value: TValue) => void;
  /** Aria-метка группы. */
  ariaLabel: string;
};

/**
 * TabControl — контрол табов (макет .seg): радио-семантика (radiogroup +
 * radio), roving tabindex — фокус на выбранном, стрелки переключают
 * значение и фокус. Компонент независим от Button/ButtonGroup: другой
 * вид таба и семантика «ровно один выбран».
 * Все константы/классы — на уровне модуля (AGENTS.md, «Стиль JSX»).
 *
 * @param props опции, значение, событие, aria-метка.
 * @returns контрол табов.
 */
export function TabControl<TValue extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: TabControlProps<TValue>) {
  // Roving tabindex и стрелки — общая механика группы (hooks/ui); фокус
  // всегда на выбранном табе (value валиден всегда).
  const { focusedValue, elementIdOf, handleKeyDown } =
    useGroupKeyboardNavigation({
      values: options.map((option) => option.value),
      value,
      onChange,
      domIdPrefix: `tab-control-${ariaLabel}`,
    });

  return (
    <span role="radiogroup" aria-label={ariaLabel} className={GROUP_CLASS}>
      {options.map((option) => {
        const isSelected = option.value === value;
        const isFocusable = option.value === focusedValue;

        const tabClass = `${HEIGHT_CLASS} cursor-pointer ${
          isSelected ? ACTIVE_CLASS : IDLE_CLASS
        }`;

        return (
          <span
            key={option.value}
            id={elementIdOf(option.value)}
            role="radio"
            aria-checked={isSelected}
            tabIndex={isFocusable ? 0 : -1}
            className={tabClass}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => handleKeyDown(event, option.value)}
          >
            {option.label}
          </span>
        );
      })}
    </span>
  );
}
