import { expandDayBoundaries } from "../utils/expandDayBoundaries";
import type { CustomerSegment } from "../types/customerSegment";
import type { IsoDate } from "../types/isoDate";
import type { DashboardQuery } from "../interfaces/dashboardQuery";
import type { DashboardRequestDto, DashboardDto } from "../types/dto";
import type { DashboardData } from "../types/dashboard";
import { fetchDashboard } from "../api/client";
import { mapDashboard } from "../mappers/mapDashboard";
import { mapSegmentToDto } from "../mappers/enumMappers";

/**
 * Готовит тело POST-запроса api.md из фильтров дашборда: календарные дни
 * раскрываются в UTC-полуинтервал [from, to), сегмент — числовой enum
 * или null (все сегменты).
 *
 * @param from начальный календарный день периода.
 * @param to конечный календарный день периода (включительно).
 * @param segment сегмент или null (все сегменты).
 * @returns тело запроса DTO.
 */
function buildDashboardRequest(
  from: IsoDate,
  to: IsoDate,
  segment: CustomerSegment | null,
): DashboardRequestDto
{
  const boundaries = expandDayBoundaries(from, to);

  return {
    from: boundaries.fromUtc.toISOString(),
    to: boundaries.toUtc.toISOString(),
    segment: mapSegmentToDto(segment),
  };
}

/**
 * Сервис дашборда — публичный контракт сервисного слоя: фильтры → данные
 * всех 11 блоков. Детали api-слоя (frontend.md, раздел 8) скрыты внутри:
 * сборка тела запроса, транспорт и маппинг DTO → app-типы; вызывающий код
 * знает только DashboardQuery → DashboardData | ApiError / ParseError.
 *
 * @param query валидированные фильтры дашборда (URL → интерфейс).
 * @param signal сигнал отмены запроса (браузерный AbortSignal); null —
 *   запрос неотменяемый (единственный потребитель живёт всю сессию).
 * @returns смонтированные данные всех 11 блоков.
 * @throws ApiError при сетевом сбое или 400/500; ParseError при рассинхроне
 * контракта (ошибки границы api — api/errors, без общего предка).
 */
export async function getDashboardData(
  query: DashboardQuery,
  signal: AbortSignal | null,
): Promise<DashboardData>
{
  const request = buildDashboardRequest(query.from, query.to, query.segment);
  const payload = await fetchDashboard(request, signal);
  const result = mapDashboard(payload as DashboardDto);

  return result;
}
