"use client";

import { Toolbar } from "../../components/ui/Toolbar";
import { PeriodPresetPicker } from "../../components/ui/PeriodPresetPicker";
import { CustomPeriodPicker } from "../../components/ui/CustomPeriodPicker";
import { PeriodRangeLabel } from "../../components/ui/PeriodRangeLabel";
import { SegmentSelect } from "../../components/ui/SegmentSelect";
import { resolvePresetRange } from "../../utils/resolvePresetRange";
import type { DashboardQuery } from "../../interfaces/dashboardQuery";
import type { DayRange } from "../../types/dayRange";
import type { CustomerSegment } from "../../types/customerSegment";
import type { IsoDate } from "../../types/isoDate";
import type { PeriodPresetType } from "../../types/periodPresetType";

/**
 * Тип props виджета тулбара (frontend-plan.md, этап 7): props query/setQuery
 * из useDashboardQuery в page.tsx; наружу ничего не отдаёт.
 */
type DashboardToolbarWidgetProps = {
  /** Текущие фильтры (источник правды URL). */
  query: DashboardQuery;
  /** Запись фильтров (router.replace, те же правила нормализации). */
  setQuery: (next: DashboardQuery) => void;
};

/**
 * Определяет активный пресет по текущему диапазону: диапазон совпал с
 * вычисленным пресетом → этот пресет подсвечен; иначе — режим «произвольный
 * период» (ui.md: выбор дат снимает подсветку с пресетов).
 *
 * @param query текущие фильтры.
 * @returns пресет или null.
 */
function resolveActivePreset(query: DashboardQuery): PeriodPresetType | null {
  const presets: PeriodPresetType[] = [
    "today",
    "7d",
    "30d",
    "this-month",
    "last-month",
  ];

  const now = new Date();

  const matchedPreset = presets.find((preset) => {
    const range = resolvePresetRange(preset, now);

    return range.from === query.from && range.to === query.to;
  });

  return matchedPreset ?? null;
}

/**
 * Определяет диапазон для показа: для активного пресета — ровно вычисленный
 * диапазон пресета (resolvePresetRange), для произвольного — from/to из URL.
 *
 * @param activePreset активный пресет или null.
 * @param query текущие фильтры.
 * @returns границы показываемого диапазона.
 */
function resolveShownRange(
  activePreset: PeriodPresetType | null,
  query: DashboardQuery,
): DayRange {
  if (activePreset !== null) {
    const presetRange = resolvePresetRange(activePreset, new Date());

    return presetRange;
  }

  const urlRange: DayRange = { from: query.from, to: query.to };

  return urlRange;
}

/**
 * Виджет тулбара (frontend.md, §6 «Инфраструктурные виджеты»): композиция
 * примитивов Toolbar + PeriodPresetPicker + CustomPeriodPicker +
 * PeriodRangeLabel + SegmentSelect; собирает DashboardQuery из событий и
 * зовёт setQuery. DateRangePicker не даёт завершить выбор невалидного
 * диапазона — правило на уровне компонента (этап 6), виджету проверять
 * нечего.
 *
 * Канонизация: любое событие переписывает все три поля query (from/to/segment)
 * — URL всегда полный, частичных записей нет.
 *
 * @param props query и setQuery из page.tsx.
 * @returns тулбар.
 */
export function DashboardToolbarWidget({
  query,
  setQuery,
}: DashboardToolbarWidgetProps) {
  const activePreset = resolveActivePreset(query);
  const shownRange = resolveShownRange(activePreset, query);

  const isCustomPeriodActive = activePreset === null;

  const handlePresetSelect = (preset: PeriodPresetType) => {
    const range = resolvePresetRange(preset, new Date());

    const nextQuery: DashboardQuery = {
      from: range.from,
      to: range.to,
      segment: query.segment,
    };

    setQuery(nextQuery);
  };

  const handleSegmentSelect = (segment: CustomerSegment | null) => {
    const nextQuery: DashboardQuery = {
      from: query.from,
      to: query.to,
      segment,
    };

    setQuery(nextQuery);
  };

  const handlePeriodChange = (from: IsoDate, to: IsoDate) => {
    const nextQuery: DashboardQuery = {
      from,
      to,
      segment: query.segment,
    };

    setQuery(nextQuery);
  };

  return (
    <Toolbar>
      {/* Левый край — «когда». */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-3">
          <PeriodPresetPicker
            activePreset={activePreset}
            onPresetSelect={handlePresetSelect}
          />

          {/* Разделитель между пресетами и «Произвольным периодом»
              (ui.md: отдельный контрол, визуально отделён). */}
          <div className="h-5 w-px bg-border" aria-hidden="true" />

          <CustomPeriodPicker
            isActive={isCustomPeriodActive}
            from={shownRange.from}
            to={shownRange.to}
            onPeriodChange={handlePeriodChange}
          />
        </div>

        <PeriodRangeLabel from={shownRange.from} to={shownRange.to} />
      </div>

      {/* Правый край — «для кого». */}
      <SegmentSelect
        segment={query.segment}
        onSegmentSelect={handleSegmentSelect}
      />
    </Toolbar>
  );
}
