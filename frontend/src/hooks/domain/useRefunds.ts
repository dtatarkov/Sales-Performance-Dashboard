"use client";

import { useBlockState } from "./useBlockState";
import type { BlockState } from "../../interfaces/blockState";
import type { DashboardData, RefundsData } from "../../types/dashboard";

/**
 * Правило пустоты блока 10 «Возвраты» (ui.md, «Потери»; domain.md, edge cases):
 * сумма потерь и список пусты → «Возвратов нет». Доля (rate) может быть null
 * при пустом знаменателе — это «—», а не пустота блока: losses 0 при непустом
 * знаменателе — реальный ноль, карточка остаётся контентом.
 *
 * @param data срез возвратов.
 * @returns true, когда нет возвратов.
 */
function isEmptyRefunds(data: RefundsData): boolean
{
  return data.value === 0 && data.top.length === 0;
}

/**
 * Селектор среза блока 10: refunds (модульный уровень).
 *
 * @param data общие данные дашборда.
 * @returns срез возвратов.
 */
function selectRefunds(data: DashboardData): RefundsData
{
  return data.refunds;
}

/**
 * Доменный хук блока 10 «Возвраты».
 *
 * @returns BlockState<RefundsData>.
 */
export function useRefunds(): BlockState<RefundsData>
{
  return useBlockState(selectRefunds, isEmptyRefunds);
}