import { formatMoney } from "./formatMoney";
import { formatNumber } from "./formatNumber";
import { formatPercent } from "./formatPercent";
import type { KpiMetricId } from "../types/dashboard";

/**
 * Форматирует значение KPI-метрики по её идентификатору (ui.md, «Сквозные
 * правила отображения чисел»): деньги (revenue, gp, avgCheck) — formatMoney,
 * проценты (margin) — formatPercent, счётчики (остальные) — formatNumber.
 *
 * @param value значение метрики или null («—»).
 * @param metricId идентификатор метрики (формат зависит от неё).
 * @returns строку значения для карточки.
 */
export function formatKpiValue(value: number | null, metricId: KpiMetricId): string
{
  if (value === null)
  {
    return "\u2014";
  }

  if (metricId === "revenue" || metricId === "gp" || metricId === "avgCheck")
  {
    return formatMoney(value);
  }

  if (metricId === "margin")
  {
    return formatPercent(value);
  }

  return formatNumber(value);
}
