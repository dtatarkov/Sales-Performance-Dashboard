"use client";

import { formatDayLabel } from "../../formatters/formatDayLabel";
import { formatDayCount } from "../../formatters/formatDayCount";
import type { IsoDate } from "../../types/isoDate";

/** Класс диапазона дат (макет .range-label strong: основной цвет, semibold). */
const RANGE_CLASS = "font-semibold text-text-primary";

/** Класс длительности (макет .range-label .dur: 11px, tertiary). */
const DURATION_CLASS = "text-[11px] text-text-tertiary";

/**
 * Тип props PeriodRangeLabel — подпись активного диапазона (ui.md, «Период»:
 * вторая строка под контролами тулбара).
 */
type PeriodRangeLabelProps = {
  /** Начало показываемого диапазона. */
  from: IsoDate;
  /** Конец показываемого диапазона (включительно). */
  to: IsoDate;
};

/**
 * PeriodRangeLabel — подпись активного диапазона (ui.md, «Период»):
 * `17 сент 2026 — 23 сент 2026 · 7 дней` — даты основным цветом,
 * длительность вторичным. Небольшой левый отступ выравнивает подпись
 * с контролами над ней (макет: .range-label, padding-left 9px).
 *
 * @param props границы показываемого диапазона.
 * @returns подпись диапазона.
 */
export function PeriodRangeLabel({ from, to }: PeriodRangeLabelProps) {
  const fromLabel = formatDayLabel(from);
  const toLabel = formatDayLabel(to);

  // Длительность: включительно, полуинтервал не участвует (UI-подпись).
  const fromMs = Date.parse(`${from}T00:00:00Z`);
  const toMs = Date.parse(`${to}T00:00:00Z`);
  const durationDays = Math.round((toMs - fromMs) / 86_400_000) + 1

  const durationLabel = formatDayCount(durationDays);

  return (
    <div className="pl-[9px] text-xs">
      <span className={RANGE_CLASS}>
        {fromLabel} — {toLabel}
      </span>

      <span className={DURATION_CLASS}>
        {" · "}
        {durationLabel}
      </span>
    </div>
  );
}
