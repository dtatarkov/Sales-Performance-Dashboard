import type {
  CancellationsDto,
  CancellationTopItemDto,
  RefundTopItemDto,
  RefundsDto,
} from "../types/dto";
import type {
  LossGroupData,
  LossTailData,
  LossTopItem,
} from "../types/dashboard";
import { parseNullableNumber, parseNumber } from "../parsers/parseNumber";
import { mapDelta } from "./delta";
import { mapSeries } from "./series";

/**
 * Маппинг группы потерь — общая структура блоков 10 и 11
 * (RefundsDto и CancellationsDto структурно совпадают). Собственная логика —
 * скаляры группы (value/rate/rateDelta); top/series/tail делегируются своим
 * мапперам (mapLossTopItem, mapSeries, mapLossTail).
 *
 * @param raw секция refunds или cancellations DTO.
 * @param source имя секции для сообщений парсеров.
 * @returns LossGroupData.
 */
export function mapLossGroup(
  raw: RefundsDto | CancellationsDto,
  source: string,
): LossGroupData
{
  return {
    value: parseNumber(raw.value, `${source}.value`),
    rate: parseNullableNumber(raw.rate, `${source}.rate`),
    rateDelta: mapDelta(raw.rateDelta, `${source}.rateDelta`),
    series: mapSeries(raw.series, `${source}.series`),
    top: raw.top.map((item, index) =>
      mapLossTopItem(item, `${source}.top[${index}]`),
    ),
    tail: mapLossTail(raw.tail, `${source}.tail`),
  };
}

/**
 * Маппинг хвоста «Остальные N» группы потерь; null DTO проходит как null —
 * за топом никого не осталось.
 *
 * @param raw хвост DTO или null.
 * @param source имя поля для сообщений парсеров.
 * @returns LossTailData или null.
 */
export function mapLossTail(
  raw: RefundsDto["tail"],
  source: string,
): LossTailData | null
{
  if (raw === null)
  {
    return null;
  }

  const count = parseNumber(raw.count, `${source}.count`);

  const valueAbsolute = parseNumber(
    raw.valueAbsolute,
    `${source}.valueAbsolute`,
  );

  const valueRelative = parseNumber(
    raw.valueRelative,
    `${source}.valueRelative`,
  );

  return { count, valueAbsolute, valueRelative };
}

/**
 * Маппинг строки топа потерь: subtitle — категория товара (возвраты) или
 * команда менеджера (отмены); у возвратов поля team нет → пустая строка.
 *
 * @param raw строка DTO (RefundTopItemDto или CancellationTopItemDto).
 * @param source имя поля для сообщений парсеров.
 * @returns LossTopItem.
 */
export function mapLossTopItem(
  raw: RefundTopItemDto | CancellationTopItemDto,
  source: string,
): LossTopItem
{
  const subtitle = "category" in raw ? raw.category : raw.team;

  return {
    id: raw.id,
    name: raw.name,
    subtitle,
    valueAbsolute: parseNumber(raw.valueAbsolute, `${source}.valueAbsolute`),
    valueRelative: parseNumber(raw.valueRelative, `${source}.valueRelative`),
    valueNormalized: parseNumber(
      raw.valueNormalized,
      `${source}.valueNormalized`,
    ),
  };
}
