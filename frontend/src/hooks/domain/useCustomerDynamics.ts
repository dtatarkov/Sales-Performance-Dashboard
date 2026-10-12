"use client";

import { useBlockState } from "./useBlockState";
import type { BlockState } from "../../interfaces/blockState";
import type {
  CustomerDynamicsData,
  DashboardData,
} from "../../types/dashboard";

/**
 * Правило пустоты блока 5 «Динамика клиентов» (ui.md, блок 5): секции «Рост»
 * и «Падение» могут быть пусты по отдельности — блок пуст только когда пусты
 * обе (ui.md: «Если нет падений (или нет роста), соответствующая секция
 * пуста»). Бэкенд и в пустом периоде возвращает обе секции с двумя датасетами
 * (пустые массивы строк), поэтому пустость определяют данные строк, а не
 * наличие секций.
 *
 * @param data срез динамики клиентов.
 * @returns true, когда ни в одной секции нет строк.
 */
function isEmptyCustomerDynamics(data: CustomerDynamicsData): boolean
{
  const hasAnyRow = data.growth.some((dataset) => dataset.items.length > 0)
    || data.decline.some((dataset) => dataset.items.length > 0);

  return !hasAnyRow;
}

/**
 * Селектор среза блока 5: customerDynamics (модульный уровень).
 *
 * @param data общие данные дашборда.
 * @returns срез динамики клиентов.
 */
function selectCustomerDynamics(data: DashboardData): CustomerDynamicsData
{
  return data.customerDynamics;
}

/**
 * Доменный хук блока 5 «Динамика клиентов».
 *
 * @returns BlockState<CustomerDynamicsData>.
 */
export function useCustomerDynamics(): BlockState<CustomerDynamicsData>
{
  return useBlockState(selectCustomerDynamics, isEmptyCustomerDynamics);
}