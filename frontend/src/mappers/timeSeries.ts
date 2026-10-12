import type { TimeSeriesDto, TimeSeriesPointDto } from "../types/dto";
import type {
  TimeSeriesData,
  TimeSeriesPoint,
} from "../types/dashboard";
import { parseDate } from "../parsers/parseDate";
import { parseNullableNumber, parseNumber } from "../parsers/parseNumber";
import { mapDataset } from "./dataset";

/**
 * Маппинг блока 6 «Динамика во времени»: даты — объекты Date; обвязка
 * датасетов — mappers/dataset.ts, индекс точки попадает в сообщения
 * парсеров через второй аргумент item-маппера.
 *
 * @param raw секция timeSeries DTO.
 * @returns TimeSeriesData.
 */
export function mapTimeSeries(raw: TimeSeriesDto): TimeSeriesData
{
  return {
    datasets: raw.datasets.map((dataset) =>
      mapDataset(dataset, mapTimeSeriesPoint)),
  };
}

/**
 * Маппинг точки ряда динамики: полуинтервал [dateFrom, dateTo); valuePrevious
 * null допустим схемой.
 *
 * @param raw точка DTO.
 * @param index индекс точки для сообщений парсеров.
 * @returns TimeSeriesPoint.
 */
export function mapTimeSeriesPoint(
  raw: TimeSeriesPointDto,
  index: number,
): TimeSeriesPoint
{
  return {
    dateFrom: parseDate(raw.dateFrom, `timeSeries[${index}].dateFrom`),
    dateTo: parseDate(raw.dateTo, `timeSeries[${index}].dateTo`),
    valueCurrent: parseNumber(
      raw.valueCurrent,
      `timeSeries[${index}].valueCurrent`,
    ),
    valuePrevious: parseNullableNumber(
      raw.valuePrevious,
      `timeSeries[${index}].valuePrevious`,
    ),
  };
}
