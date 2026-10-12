"use client";

import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

import { useDashboardQueryContext } from "../../contexts/dashboardQueryContext";
import { getDashboardData } from "../../services/dashboardService";
import type { Dashboard } from "../../interfaces/dashboard";
import type { DashboardQuery } from "../../interfaces/dashboardQuery";

/**
 * Ключ кэша — ровно [from, to, segment] (frontend.md, раздел 5): другие поля
 * query в ключ не входят, активные датасеты и hover — локальный state виджетов.
 *
 * @param query фильтры дашборда.
 * @returns ключ кэша TanStack Query.
 */
function buildCacheKey(query: DashboardQuery): [string, string, string, string | null]
{
  return ["dashboard", query.from, query.to, query.segment];
}

/**
 * Базовый доменный хук — владелец единственного запроса приложения
 * (frontend.md, раздел 5): один `useQuery` на весь дашборд, ключ
 * `[from, to, segment]` из контекста, SWR-поведение через
 * `placeholderData: keepPreviousData` — при смене фильтров блоки удерживают
 * прошлые данные с `isRefreshing`, не мигая skeleton'ом.
 *
 * Наружу (в widgets/toasts) отдаёт только `DashboardStatus`: ошибки
 * конвертированы в `hasError` — ApiError/ParseError не покидают domain
 * (хитрое место №7 frontend-plan.md). Сырой маппед ответ — внутренняя
 * деталь: блочные хуки читают его из этого же useQuery через селекторы
 * (этап 4 плана).
 *
 * @returns статус запроса для тостов и данные для блочных хуков.
 */
export function useDashboard(): Dashboard
{
  const query = useDashboardQueryContext();

  const dashboardQuery = useQuery({
    queryKey: buildCacheKey(query),
    // Сигнал отмены react-query не пробрасывается (null): единственный
    // потребитель запроса живёт всю сессию страницы, отменять нечего, а в
    // dev StrictMode перемонтирует дерево и обрывал сигнал — первый запрос
    // выглядел «cancelled» в devtools и делался повторно. Без сигнала
    // первый запрос переживает перемонтировку и дедуплицируется, сменённый
    // пресет догружается в кэш и переиспользуется при возврате.
    queryFn: () => getDashboardData(query, null),
    // Удержание предыдущих данных при смене фильтров (SWR): data не станет
    // undefined, блоки не мигают skeleton'ом (frontend.md, раздел 5).
    placeholderData: (previousData) => previousData,
    // Данные сразу устаревают: возврат к ранее посещённому пресету в той же
    // сессии показывает кэш и параллельно обновляет из API (ui.md, «Смена
    // периода»); Infinity превращал кэш в «навсегда свежий» — повторный
    // выбор пресета не запрашивал API вовсе.
    staleTime: 0,
  });

  const { data, isPending, isFetching, isPlaceholderData, error, refetch } =
    dashboardQuery;

  // data === null только до первого успешного ответа; при смене фильтров
  // placeholderData удерживает прошлый срез (хитрое место №6 frontend-plan.md).
  const isLoading = isPending;
  // Обновление в фоне — любой запрос после первого (в т.ч. возврат к кэшу
  // другого пресета): сигналит toast «Обновление данных…» (ui.md, «Смена
  // периода»). Димминг блоков — по isPlaceholderData (показан чужой срез).
  const isRefreshing = !isPending && isFetching;
  const hasError = error !== null;
  const hasData = data !== undefined;

  // retry синхронный () => void: refetch возвращает Promise, но awaited-результат
  // не нужен — состояние (error/data) придёт реактивно через useQuery.
  // void — маркировка осознанного fire-and-forget.
  const retry = useCallback(() =>
  {
    void refetch();
  }, [refetch]);

  const status = { hasData, isLoading, isRefreshing, hasError, retry };

  return {
    status,
    data: data ?? null,
    isPlaceholderData,
  };
}