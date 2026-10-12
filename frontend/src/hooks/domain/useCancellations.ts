"use client";

import { useBlockState } from "./useBlockState";
import type { BlockState } from "../../interfaces/blockState";
import type { CancellationsData, DashboardData } from "../../types/dashboard";

/**
 * Правило пустоты блока 11 «Отмены» (ui.md, «Потери»; domain.md, edge cases):
 * сумма и список пусты → «Отмен нет»; реальный ноль при непустом знаменателе —
 * контент с «0 ₽».
 *
 * @param data срез отмен.
 * @returns true, когда нет отмен.
 */
function isEmptyCancellations(data: CancellationsData): boolean
{
  return data.value === 0 && data.top.length === 0;
}

/**
 * Селектор среза блока 11: cancellations (модульный уровень).
 *
 * @param data общие данные дашборда.
 * @returns срез отмен.
 */
function selectCancellations(data: DashboardData): CancellationsData
{
  return data.cancellations;
}

/**
 * Доменный хук блока 11 «Отмены».
 *
 * @returns BlockState<CancellationsData>.
 */
export function useCancellations(): BlockState<CancellationsData>
{
  return useBlockState(selectCancellations, isEmptyCancellations);
}