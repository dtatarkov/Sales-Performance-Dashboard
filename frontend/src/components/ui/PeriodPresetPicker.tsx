"use client";

import { ButtonGroup } from "./ButtonGroup";
import type { PeriodPresetType } from "../../types/periodPresetType";

/**
 * Тип props PeriodPresetPicker — сегментированный контрол пресетов периода
 * (ui.md, «Период»: `Сегодня` · `7 дней` · `30 дней` · `Этот месяц` ·
 * `Прошлый месяц`).
 */
type PeriodPresetPickerProps = {
  /** Активный пресет; null — режим «произвольный период». */
  activePreset: PeriodPresetType | null;
  /** Выбор пресета. */
  onPresetSelect: (preset: PeriodPresetType) => void;
};

/** Опции пресетов (ui.md, «Период»; порядок как в макете). */
const PRESET_OPTIONS = [
  { value: "today", label: "Сегодня" },
  { value: "7d", label: "7 дней" },
  { value: "30d", label: "30 дней" },
  { value: "this-month", label: "Этот месяц" },
  { value: "last-month", label: "Прошлый месяц" },
] as const;

/**
 * PeriodPresetPicker — пресеты периода тулбара (ui.md, «Период»):
 * ButtonGroup без deselect (всегда выбран ровно один пресет либо режим
 * «произвольный период» — тогда null и подсветки нет).
 *
 * @param props активный пресет и событие выбора.
 * @returns контрол пресетов.
 */
export function PeriodPresetPicker({
  activePreset,
  onPresetSelect,
}: PeriodPresetPickerProps) {
  return (
    <ButtonGroup
      options={PRESET_OPTIONS}
      value={activePreset}
      onChange={(value) => {
        if (value !== null) {
          onPresetSelect(value);
        }
      }}
      allowDeselect={false}
      ariaLabel="Пресеты периода"
    />
  );
}
