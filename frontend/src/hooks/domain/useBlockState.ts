"use client";

import { useMemo } from "react";

import { useDashboard } from "./useDashboard";
import type { BlockState } from "../../interfaces/blockState";
import type { DashboardData } from "../../types/dashboard";

/**
 * Хук-обёртка единой механики блочного среза (frontend-plan.md, этап 4;
 * frontend.md, раздел 5): принимает селектор среза и правило пустоты блока,
 * возвращает `BlockState<T>` — ровно три состояния.
 *
 * Селектор и проверка пустоты — не свободные функции, а часть хука: они живут
 * от состояния запроса (реактивность) и memo-зируются (хитрое место №5
 * frontend-plan.md — без референсной стабильности перерисовка одного блока
 * тянет остальные).
 *
 * Правила слотов (ui.md, «Контракт хука блока»):
 * - `data === null` → skeleton (первого успешного ответа ещё не было);
 * - `data !== null && isEmpty(data)` → empty-слот;
 * - иначе → content с модификатором isRefreshing.
 *
 * @param selectBlockData селектор среза блока из общих данных дашборда.
 * @param isEmptyBlock правило пустоты блока по ui.md (без данных → false:
 *   skeleton-слот решает всё до первого ответа).
 * @returns BlockState<T> для виджета.
 */
export function useBlockState<TData>(
  selectBlockData: (data: DashboardData) => TData,
  isEmptyBlock: (data: TData) => boolean,
): BlockState<TData>
{
  const { data, isPlaceholderData } = useDashboard();

  const blockData = useMemo(
    () => (data === null ? null : selectBlockData(data)),
    [data, selectBlockData],
  );

  const isEmpty = useMemo(
    () => (blockData === null ? false : isEmptyBlock(blockData)),
    [blockData, isEmptyBlock],
  );

  return { data: blockData, isEmpty, isRefreshing: isPlaceholderData };
}