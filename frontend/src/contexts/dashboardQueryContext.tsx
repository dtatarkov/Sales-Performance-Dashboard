"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { DashboardQuery } from "../interfaces/dashboardQuery";

/**
 * Контекст глобальных фильтров (frontend.md, раздел 4): канал доставки
 * query от page.tsx к hooks/domain. Значение по умолчанию — null: обращение
 * без провайдера — ошибка программирования.
 */
const DashboardQueryContext = createContext<DashboardQuery | null>(null);

/**
 * Провайдер контекста: публикует готовое значение query (значение приходит
 * из useDashboardQuery в page.tsx; провайдер его не вычисляет).
 *
 * @param props.query значение фильтров.
 * @param props.children дерево, которому доступен контекст.
 * @returns обёрнутое дерево.
 */
export function DashboardQueryProvider({
  query,
  children,
}: {
  query: DashboardQuery;
  children: ReactNode;
}) {
  return (
    <DashboardQueryContext.Provider value={query}>
      {children}
    </DashboardQueryContext.Provider>
  );
}

/**
 * Хук чтения глобальных фильтров из контекста (контракт —
 * interfaces/dashboardQueryContext.ts). Потребители — только hooks/domain.
 *
 * @returns текущий DashboardQuery.
 * @throws если провайдер DashboardQueryProvider не установлен — ошибка
 *   программирования, а не сценарий работы.
 */
export function useDashboardQueryContext(): DashboardQuery {
  const query = useContext(DashboardQueryContext);

  if (query === null) {
    throw new Error(
      "useDashboardQueryContext: провайдер DashboardQueryProvider не установлен",
    );
  }

  return query;
}