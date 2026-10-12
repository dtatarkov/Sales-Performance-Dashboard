import type { DashboardRequestDto } from "../types/dto";
import { API_BASE_URL } from "../configuration/env";
import { fetchData } from "./request";

/**
 * Запрос дашборда — описание эндпоинта над общим конвейером fetchData
 * (api/request.ts): URL, метод, тело. Новой странице достаточно своей такой
 * же лямбды. Базовый URL берётся из configuration/env — единственного
 * источника NEXT_PUBLIC_API_BASE_URL; путь эндпоинта здесь же
 * (api.md — один контур).
 *
 * @param body тело POST-запроса — раскрытые UTC-границы и сегмент.
 * @param signal сигнал отмены запроса (браузерный AbortSignal); null —
 *   запрос без отмены (fetch принимает null как отсутствие сигнала).
 * @returns разобранный JSON ответа (валидация полей — мапперы).
 * @throws ApiError при 400/500/сетевом сбое/нечитаемом теле.
 */
export async function fetchDashboard(
  body: DashboardRequestDto,
  signal: AbortSignal | null,
): Promise<unknown>
{
  const request = () =>
    fetch(`${API_BASE_URL}/api/v1/dashboard`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });

  const payload = await fetchData(request);

  return payload;
}

