"use client";

import { useBlockState } from "./useBlockState";
import type { BlockState } from "../../interfaces/blockState";
import type { DashboardData, ManagerRatingData } from "../../types/dashboard";

/**
 * Правило пустоты блока 2 «Рейтинг менеджеров» (ui.md, «Пустой период без
 * продаж»): блок показывает заглушку, когда оплаченных продаж нет ни у кого.
 * Бэкенд и в пустом периоде возвращает весь ростер менеджеров с нулями
 * (пустой список строк не признак), поэтому пустоту определяют данные строк:
 * все salesCount равны нулю. Отдельный менеджер с нулём в непустом периоде
 * остаётся в списке (ui.md) — важен итог по всем строкам обоих датасетов.
 *
 * @param data срез рейтинга.
 * @returns true, когда ни у одного менеджера нет продаж.
 */
function isEmptyManagerRating(data: ManagerRatingData): boolean
{
  const hasAnySale = data.datasets.some((dataset) =>
    dataset.items.some((item) => item.salesCount > 0),
  );

  return !hasAnySale;
}

/**
 * Селектор среза блока 2: managerRating из общих данных (модульный уровень —
 * референсная стабильность).
 *
 * @param data общие данные дашборда.
 * @returns срез рейтинга.
 */
function selectManagerRating(data: DashboardData): ManagerRatingData
{
  return data.managerRating;
}

/**
 * Доменный хук блока 2 «Рейтинг менеджеров».
 *
 * @returns BlockState<ManagerRatingData>.
 */
export function useManagerRating(): BlockState<ManagerRatingData>
{
  return useBlockState(selectManagerRating, isEmptyManagerRating);
}