/**
 * Единица относительного вклада — определяет формат и текст подписи
 * (ui.md, «Тип Contribution»): `gp` → «% от ВП периода»,
 * `revenue` → «% от выручки периода», `units` → «% от объёма периода»,
 * `ac` → «× к среднему чеку».
 */
export type ContributionUnit = "gp" | "revenue" | "units" | "ac";

/**
 * Вклад элемента в результат периода — три формы одного значения: крупное
 * число, подпись и бар (ui.md, «Тип Contribution»). Рассчитывается сервером.
 */
export type Contribution = {
  /** Крупное значение на карточке (сырое число). */
  valueAbsolute: number;
  /** Относительный вклад: доля (26,2) или кратность (1,7); null — не определён. */
  valueRelative: number | null;
  /** Единица измерения `valueRelative`. */
  valueRelativeUnit: ContributionUnit;
  /** Значение бара, 0–100 — масштабировано к максимуму группы, не доля. */
  valueNormalized: number;
};