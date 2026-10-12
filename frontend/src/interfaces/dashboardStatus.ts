/**
 * Статус запроса дашборда для виджета widgets/toasts (frontend.md, раздел 5).
 * Виджеты блоков статуса не видят: ошибка конвертируется в hasError внутри
 * hooks/domain (хитрое место №7 frontend-plan.md).
 */
export type DashboardStatus = {
  /** Успешно получен хотя бы один ответ за сессию страницы. */
  hasData: boolean;
  /** Первый запрос в полёте (skeleton'ы). */
  isLoading: boolean;
  /** Фоновое обновление (toast «Обновление данных…»). */
  isRefreshing: boolean;
  /** Последняя попытка не удалась. */
  hasError: boolean;
  /** Единственная точка повтора — вызывается только из widgets/toasts. */
  retry: () => void;
};