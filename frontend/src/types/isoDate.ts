/**
 * Календарный день в формате YYYY-MM-DD (UTC) — формат параметров `from`/`to`
 * URL-контракта (frontend.md, раздел 4).
 *
 * Брендированный псевдоним: значение создаётся только через валидирующий
 * парсинг (resolvePresetRange, разбор URL в hooks/app), что гарантирует
 * корректность строки на границах слоёв.
 */
declare const isoDateBrand: unique symbol;

export type IsoDate = string & { readonly [isoDateBrand]: true };