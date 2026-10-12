"use client";

import { useBlockState } from "./useBlockState";
import type { BlockState } from "../../interfaces/blockState";
import type { DashboardData, RecentSalesData } from "../../types/dashboard";

/**
 * Правило пустоты блока 9 «Последние продажи» (ui.md, блок 9): сделок нет —
 * заглушка «нет данных» (итоговой агрегатной строки у ленты нет).
 *
 * @param data срез ленты продаж.
 * @returns true, когда сделок нет.
 */
function isEmptyRecentSales(data: RecentSalesData): boolean
{
  return data.sales.length === 0;
}

/**
 * Селектор среза блока 9: recentSales (модульный уровень).
 *
 * @param data общие данные дашборда.
 * @returns срез ленты продаж.
 */
function selectRecentSales(data: DashboardData): RecentSalesData
{
  return data.recentSales;
}

/**
 * Доменный хук блока 9 «Последние продажи».
 *
 * @returns BlockState<RecentSalesData>.
 */
export function useRecentSales(): BlockState<RecentSalesData>
{
  return useBlockState(selectRecentSales, isEmptyRecentSales);
}