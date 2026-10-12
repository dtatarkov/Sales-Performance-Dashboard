import type { DashboardQuery } from "./dashboardQuery";

/**
 * Публичный контракт хука useDashboardQuery — единственная граница
 * `searchParams` (frontend.md, раздел 4): чтение с нормализацией и запись
 * через `router.replace`.
 */
export interface DashboardQueryContextValue
{
  /** Текущий нормализованный query из URL. */
  query: DashboardQuery;
  /** Записать новый query в URL (без скролла). */
  setQuery: (next: DashboardQuery) => void;
}
