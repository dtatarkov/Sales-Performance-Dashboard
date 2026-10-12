import type { DashboardData } from "../types/dashboard";
import type { DashboardStatus } from "./dashboardStatus";

/**
 * Публичный контракт хука useDashboard (frontend.md, раздел 5): статус
 * для тостов, последний срез данных или null до первого ответа, флаг
 * placeholder-обновления для блоков (SWR-удержание).
 */
export interface Dashboard
{
  /** Статус запроса для виджета widgets/toasts. */
  status: DashboardStatus;
  /** Данные дашборда; null только до первого успешного ответа. */
  data: DashboardData | null;
  /** Фоновое обновление: показан прошлый срез (placeholderData). */
  isPlaceholderData: boolean;
}
