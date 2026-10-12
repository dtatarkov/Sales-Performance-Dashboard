"use client";

import { useBlockState } from "./useBlockState";
import type { BlockState } from "../../interfaces/blockState";
import type { DashboardData, CustomerTopData } from "../../types/dashboard";

/**
 * Правило пустоты блока 4 «Клиенты — Топ-10» (ui.md, блок 4).
 *
 * @param data срез топа клиентов.
 * @returns true, когда нет строк ни в одном датасете.
 */
function isEmptyCustomerTop(data: CustomerTopData): boolean
{
  return data.datasets.every((dataset) => dataset.items.length === 0);
}

/**
 * Селектор среза блока 4: topCustomers (модульный уровень).
 *
 * @param data общие данные дашборда.
 * @returns срез топа клиентов.
 */
function selectCustomerTop(data: DashboardData): CustomerTopData
{
  return data.topCustomers;
}

/**
 * Доменный хук блока 4 «Клиенты — Топ-10».
 *
 * @returns BlockState<CustomerTopData>.
 */
export function useTopCustomers(): BlockState<CustomerTopData>
{
  return useBlockState(selectCustomerTop, isEmptyCustomerTop);
}