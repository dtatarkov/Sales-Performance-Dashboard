"use client";

import { DeltaText } from "./DeltaText";
import { Sparkline } from "./Sparkline";
import { useAnimatedCounter } from "../../hooks/ui/useAnimatedCounter";
import { formatKpiValue } from "../../formatters/formatKpiValue";
import { kpiColorOf } from "../../configuration/kpiColors";
import { MISSING_VALUE_MARKER } from "../../configuration/missingValueMarker";
import type { KpiCardData, KpiMetricId } from "../../types/dashboard";

/** Высота KPI-карточки — токен globals.css. */
const KPI_HEIGHT = "var(--kpi-height)";

/** Класс KPI-карточки. */
const KPI_CARD_CLASS =
  "flex flex-col gap-1.5 rounded-xl border border-border bg-surface p-4";

/** Класс подписи KPI-карточки (капс, макет .kpi-label). */
const KPI_LABEL_CLASS =
  "text-[11px] font-medium uppercase tracking-wide text-text-tertiary";

/** Класс главного числа KPI-карточки (макет .kpi-value: bold 1.5rem). */
const KPI_VALUE_CLASS =
  "text-2xl font-bold tabular-nums text-text-primary";

/** Класс Δ KPI-карточки (макет .kpi-delta: 12px). */
const KPI_DELTA_CLASS = "text-xs font-medium";

/** Класс подписи «данных нет» пустого периода — 13px, тертиарный, как в
    карточке «Лучший менеджер» (зазор даёт gap-1.5 карточки). */
const KPI_EMPTY_HINT_CLASS = "text-[13px] text-text-tertiary";

/**
 * Тип props KpiMetricCard — числовая KPI-карточка (ui.md, блок 1).
 */
type KpiMetricCardProps = {
  /** Данные карточки. */
  data: KpiCardData;
  /** Подпись метрики (капс). */
  label: string;
  /** Идентификатор метрики — определяет формат значения (KpiMetricId). */
  metricId: KpiMetricId;
  /** Номер цвета KPI-серии (1–6) — цвет sparkline. */
  colorIndex: number;
  /** Пустой период (нет оплаченных продаж): вместо значения, дельты и
      sparkline — подпись «данных нет» (ui.md, «Пустой период без продаж»;
      без прочерка — отступление от макета state 4 по решению пользователя,
      для соответствия карточке «Лучший менеджер»). */
  isEmpty: boolean;
};

/**
 * KpiMetricCard — числовая KPI-карточка (ui.md, блок 1): подпись (капс),
 * крупное число (анимированный счётчик), Δ цветным текстом без фона
 * (DeltaText, макет .kpi-delta), sparkline прижат к нижнему краю.
 * Формат значения определяется metricId (formatKpiValue).
 *
 * Пустой период: карточка остаётся, но вместо значения, дельты и sparkline
 * выводится только подпись «данных нет» — визуально совпадает с пустой
 * карточкой «Лучший менеджер».
 *
 * @param props данные карточки, подпись, метрика, номер цвета, признак
 *   пустого периода.
 * @returns карточку метрики.
 */
export function KpiMetricCard({
  data,
  label,
  metricId,
  colorIndex,
  isEmpty,
}: KpiMetricCardProps) {
  const color = kpiColorOf(colorIndex);

  const sparklineValues = data.series.map((point) => point.value);

  const animatedValue = useAnimatedCounter(data.value ?? 0);

  const displayValue =
    data.value === null
      ? MISSING_VALUE_MARKER
      : formatKpiValue(Math.round(animatedValue * 100) / 100, metricId);

  const cardStyle = { height: KPI_HEIGHT } as const;

  return (
    <div
      className={KPI_CARD_CLASS}
      style={cardStyle}
    >
      <span className={KPI_LABEL_CLASS}>
        {label}
      </span>

      {isEmpty ? (
        <span className={KPI_EMPTY_HINT_CLASS}>данных нет</span>
      ) : (
        <>
          <span className={KPI_VALUE_CLASS}>
            {displayValue}
          </span>

          <DeltaText
            delta={data.delta}
            className={KPI_DELTA_CLASS}
          />

          <div className="mt-auto">
            <Sparkline
              values={sparklineValues}
              color={color}
            />
          </div>
        </>
      )}
    </div>
  );
}
