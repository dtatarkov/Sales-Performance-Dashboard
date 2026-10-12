/**
 * Контракт хука блока — ровно три состояния (frontend.md, раздел 5;
 * ui.md, «Контракт хука блока»).
 *
 * Выбор слота тривиален и ошибок не знает:
 * data === null → skeleton; data !== null && isEmpty → empty; иначе → content.
 */
export type BlockState<TData> = {
  /** Срез данных блока; null → skeleton (первого ответа ещё не было). */
  data: TData | null;
  /** Данные получены, но блок пуст по правилам ui.md → empty-слот. */
  isEmpty: boolean;
  /** Фоновое обновление поверх данных (модификатор контента, dimming). */
  isRefreshing: boolean;
};