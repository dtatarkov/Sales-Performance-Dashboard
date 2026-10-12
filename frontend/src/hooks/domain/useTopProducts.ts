"use client";

import { useBlockState } from "./useBlockState";
import type { BlockState } from "../../interfaces/blockState";
import type { DashboardData, ProductsData } from "../../types/dashboard";

/**
 * Правило пустоты блока 8 «Лучшие продукты» (ui.md, блок 8): товаров меньше
 * десяти показывается сколько есть — пустоту определяет отсутствие строк.
 *
 * @param data срез продуктов.
 * @returns true, когда нет строк ни в одном датасете.
 */
function isEmptyProducts(data: ProductsData): boolean
{
  return data.datasets.every((dataset) => dataset.items.length === 0);
}

/**
 * Селектор среза блока 8: topProducts (модульный уровень).
 *
 * @param data общие данные дашборда.
 * @returns срез продуктов.
 */
function selectTopProducts(data: DashboardData): ProductsData
{
  return data.topProducts;
}

/**
 * Доменный хук блока 8 «Лучшие продукты».
 *
 * @returns BlockState<ProductsData>.
 */
export function useTopProducts(): BlockState<ProductsData>
{
  return useBlockState(selectTopProducts, isEmptyProducts);
}