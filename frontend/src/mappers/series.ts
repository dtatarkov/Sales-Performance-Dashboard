import type { SeriesPointDto } from "../types/dto";
import type { SeriesPoint } from "../types/seriesPoint";
import { parseDate } from "../parsers/parseDate";
import { parseNumber } from "../parsers/parseNumber";

/**
 * Маппинг точки серии (sparkline): dateFrom — через parseDate (объект Date);
 * dateTo спарклайн не показывает, поле контракта не маппится.
 *
 * @param raw точка DTO.
 * @param source имя поля для сообщений парсеров.
 * @param index индекс точки в серии.
 * @returns SeriesPoint.
 */
export function mapSeriesPoint(
  raw: SeriesPointDto,
  source: string,
  index: number,
): SeriesPoint
{
  const value = parseNumber(raw.value, `${source}[${index}].value`);
  const date = parseDate(raw.dateFrom, `${source}[${index}].dateFrom`);

  return { value, date };
}

/**
 * Маппинг серии точек (sparkline): делегирует точки mapSeriesPoint.
 *
 * @param raw массив точек DTO.
 * @param source имя поля для сообщений парсеров.
 * @returns массив точек с Date.
 */
export function mapSeries(
  raw: SeriesPointDto[],
  source: string,
): SeriesPoint[]
{
  return raw.map((point, index) => mapSeriesPoint(point, source, index));
}
