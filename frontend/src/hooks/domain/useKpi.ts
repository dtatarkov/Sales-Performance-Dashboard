"use client";

import { useBlockState } from "./useBlockState";
import type { BlockState } from "../../interfaces/blockState";
import type { DashboardData, KpiData } from "../../types/dashboard";

/**
 * Правило пустоты блока 1 «KPI-карточки» (ui.md, «Пустой период без
 * продаж»): период пуст, когда за него нет оплаченных продаж — счётчик
 * продаж не пришёл (null) или равен нулю (бэкенд шлёт 0, не null). Пустой
 * период рендится тем же рядом карточек — «—» с подписью «данных нет»
 * (KpiWidget, KpiMetricCard), а не иконкой-заглушкой блока.
 *
 * @param data срез KPI.
 * @returns true, когда за период нет оплаченных продаж.
 */
function isEmptyKpi(data: KpiData): boolean
{
  const salesCount = data.salesCount.value;

  return salesCount === null || salesCount === 0;
}

/**
 * Селектор среза блока 1: kpi из общих данных дашборда. Функция модульного
 * уровня — референсно стабильна, memo не нужен (useBlockState memo-зирует
 * результат сам).
 *
 * @param data общие данные дашборда.
 * @returns срез KPI.
 */
function selectKpi(data: DashboardData): KpiData
{
  return data.kpi;
}

/**
 * Доменный хук блока 1 «KPI-карточки»: срез kpi + правило пустоты.
 *
 * @returns BlockState<KpiData>.
 */
export function useKpi(): BlockState<KpiData>
{
  return useBlockState(selectKpi, isEmptyKpi);
}