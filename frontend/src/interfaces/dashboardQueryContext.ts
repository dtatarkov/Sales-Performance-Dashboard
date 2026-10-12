import type { DashboardQuery } from "../interfaces/dashboardQuery";

/**
 * Публичный контракт контекста глобальных фильтров (frontend.md, раздел 4).
 * Провайдер живёт в page.tsx; потребители — hooks/domain (чтение query) и
 * hooks/app (запись через setQuery).
 *
 * Значение по умолчанию — null: обращение к контексту без провайдера —
 * ошибка программирования (хук-потребитель обязан на неё реагировать).
 */
export const DashboardQueryContextContract = {
  /** Значение по умолчанию контекста: null — провайдер не установлен. */
  defaultValue: null as DashboardQuery | null,
};

/**
 * Хук чтения глобальных фильтров из контекста.
 *
 * @returns текущий DashboardQuery.
 * @throws если провайдер DashboardQueryProvider не установлен.
 */
export type UseDashboardQueryContext = () => DashboardQuery;
