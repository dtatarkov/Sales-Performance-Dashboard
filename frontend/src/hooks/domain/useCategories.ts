"use client";

import { useBlockState } from "./useBlockState";
import type { BlockState } from "../../interfaces/blockState";
import type { CategoriesData, DashboardData } from "../../types/dashboard";

/**
 * Правило пустоты блока 7 «Продажи по категориям» (ui.md, блок 7).
 *
 * @param data срез категорий.
 * @returns true, когда нет строк ни в одном датасете.
 */
function isEmptyCategories(data: CategoriesData): boolean
{
  return data.datasets.every((dataset) => dataset.items.length === 0);
}

/**
 * Селектор среза блока 7: categories (модульный уровень).
 *
 * @param data общие данные дашборда.
 * @returns срез категорий.
 */
function selectCategories(data: DashboardData): CategoriesData
{
  return data.categories;
}

/**
 * Доменный хук блока 7 «Продажи по категориям».
 *
 * @returns BlockState<CategoriesData>.
 */
export function useCategories(): BlockState<CategoriesData>
{
  return useBlockState(selectCategories, isEmptyCategories);
}