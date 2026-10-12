"use client";

import { Button } from "./Button";
import { DateRangePicker } from "./DateRangePicker";
import type { IsoDate } from "../../types/isoDate";

/** Иконка календарика триггера (stroke currentColor — цвет наследуется
    от состояния кнопки: акцент в активном, вторичный в обычном). */
const CALENDAR_ICON = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 9h18" />
    <path d="M8 3v4" />
    <path d="M16 3v4" />
  </svg>
);


/**
 * Тип props CustomPeriodPicker — кнопка «Произвольный период» с пикером
 * диапазона (ui.md, «Период»: отдельный контрол, визуально отделённый от
 * пресетов, всегда активный; выбор дат снимает подсветку с пресетов).
 */
type CustomPeriodPickerProps = {
  /** Активен ли режим «произвольный период» (нет активного пресета). */
  isActive: boolean;
  /** Начало показываемого диапазона. */
  from: IsoDate;
  /** Конец показываемого диапазона (включительно). */
  to: IsoDate;
  /** Завершение выбора произвольного диапазона. */
  onPeriodChange: (from: IsoDate, to: IsoDate) => void;
};

/**
 * CustomPeriodPicker — «Произвольный период» тулбара (ui.md, «Период»):
 * DateRangePicker с триггером-кнопкой (базовая Button — тот же вид, что у
 * пресетов, без приглушения); активное состояние — когда нет активного
 * пресета. Невалидный диапазон завершить выбор нельзя — правило уровня
 * DateRangePicker (frontend-plan.md, этап 6).
 *
 * @param props признак активности, диапазон, событие завершения выбора.
 * @returns контрол произвольного периода.
 */
export function CustomPeriodPicker({
  isActive,
  from,
  to,
  onPeriodChange,
}: CustomPeriodPickerProps) {
  return (
    <DateRangePicker
      from={from}
      to={to}
      onPeriodChange={onPeriodChange}
      triggerContent={
        <Button isActive={isActive}>
          {CALENDAR_ICON}
          Произвольный период
        </Button>
      }
    />
  );
}
