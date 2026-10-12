"use client";

import { useBlockState } from "./useBlockState";
import type { BlockState } from "../../interfaces/blockState";
import type {
  DashboardData,
  ManagerComparisonData,
} from "../../types/dashboard";

/**
 * Правило пустоты блока 3 «Сравнение менеджеров» (ui.md, «Пустой период без
 * продаж»): блок показывает заглушку, когда оплаченных продаж нет ни у кого.
 * Бэкенд и в пустом периоде возвращает ростер менеджеров с нулевыми
 * значениями, поэтому пустоту определяют данные строк: все value обоих
 * датасетов равны нулю (появился хоть один ненулевой — период непустой).
 *
 * @param data срез сравнения.
 * @returns true, когда все значения метрик нулевые.
 */
function isEmptyManagerComparison(data: ManagerComparisonData): boolean
{
  const hasAnyValue = data.datasets.some((dataset) =>
    dataset.items.some((item) => item.value !== 0),
  );

  return !hasAnyValue;
}

/**
 * Селектор среза блока 3: managerComparison (модульный уровень).
 *
 * @param data общие данные дашборда.
 * @returns срез сравнения.
 */
function selectManagerComparison(data: DashboardData): ManagerComparisonData
{
  return data.managerComparison;
}

/**
 * Доменный хук блока 3 «Сравнение менеджеров».
 *
 * @returns BlockState<ManagerComparisonData>.
 */
export function useManagerComparison(): BlockState<ManagerComparisonData>
{
  return useBlockState(selectManagerComparison, isEmptyManagerComparison);
}