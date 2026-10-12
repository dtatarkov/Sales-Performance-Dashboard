import type { ProblemDetailsDto } from "../types/dto";
import { ApiError } from "../errors/apiError";

/**
 * Логика обработки запросов границы api (frontend.md, раздел 8): конвейер
 * fetchData — от вызова запрос-лямбды до разобранного JSON — и обработка
 * ответа processResponse. Единственное место abort-логики и конвертации
 * Response → данные | ApiError: новые эндпоинты передают свою лямбду
 * и не дублируют try/catch.
 */

/**
 * Общий транспортный конвейер: вызов переданной запрос-лямбды, проброс
 * отмены, конвертация сетевого сбоя и обработка ответа (processResponse).
 *
 * @param request запрос-лямбда — реальный fetch конкретного эндпоинта
 * (обязана учитывать переданный signal).
 * @returns разобранный JSON ответа (валидация полей — мапперы).
 * @throws ApiError при сетевом сбое/400/500/нечитаемом теле; AbortError
 * пробрасывается как есть — это добровольное прерывание, а не ошибка.
 */
export async function fetchData(
  request: () => Promise<Response>,
): Promise<unknown>
{
  let response: Response;

  try
  {
    response = await request();
  } catch (error)
  {
    // Сетевой сбой или отмена. Abort повторно выбрасывается — это не ошибка
    // запроса, а добровольное прерывание запроса вызывающим кодом.
    if (error instanceof DOMException && error.name === "AbortError")
    {
      throw error;
    }

    throw new ApiError(null, null, "Не удалось связаться с сервером");
  }

  const payload = await processResponse(response);

  return payload;
}

/**
 * Обрабатывает HTTP-ответ: неуспешный статус (400/500) разбирается как
 * ProblemDetails (api.md «Ошибки»), успешный — как JSON. Нечитаемое тело
 * 200 — тоже ApiError: сырая синтаксическая ошибка JSON.parse наружу
 * границы не выходит.
 *
 * @param response ответ fetch.
 * @returns разобранный JSON ответа (валидация полей — мапперы).
 * @throws ApiError при 400/500 или нечитаемом теле успешного ответа.
 */
async function processResponse(response: Response): Promise<unknown>
{
  if (!response.ok)
  {
    throw await createApiError(response);
  }

  let payload: unknown;

  try
  {
    payload = await response.json();
  } catch
  {
    // Статус успешный, но тело не JSON — контракт нарушен на транспорте.
    throw new ApiError(
      response.status,
      null,
      `Сервер вернул нечитаемый ответ (${response.status})`,
    );
  }

  return payload;
}

/**
 * Разбирает неуспешный HTTP-ответ в ApiError. Тело 500 не раскрывает деталей
 * сервера: без JSON используется общий текст статуса.
 *
 * @param response неуспешный Response.
 * @returns ошибка с разбором ProblemDetails, если тело соответствует.
 */
async function createApiError(response: Response): Promise<ApiError>
{
  let problemJson: unknown = null;

  try
  {
    problemJson = await response.json();
  } catch
  {
    // Тело не JSON — используем общий текст статуса.
  }

  const problem = parseProblemDetails(problemJson);
  const firstError = problem.errors?.[0];

  return new ApiError(
    response.status,
    firstError?.code ?? null,
    problem.detail ?? problem.title ?? `Ошибка сервера ${response.status}`,
  );
}

/**
 * Разбирает JSON-тело ошибки в ProblemDetails по-аккуратному
 * (api.md, RFC 7807): типы DTO не гарантируют, что сервер вернул ожидаемую
 * структуру. Приватная деталь обработки неуспешных ответов этого модуля.
 *
 * @param raw разобранный JSON или null (тело не JSON).
 * @returns поля ProblemDetails или пустой объект.
 */
function parseProblemDetails(raw: unknown): ProblemDetailsDto
{
  if (raw === null || typeof raw !== "object")
  {
    return {};
  }

  const record = raw as Record<string, unknown>;
  const title = typeof record.title === "string" ? record.title : undefined;
  const status = typeof record.status === "number" ? record.status : undefined;
  const detail = typeof record.detail === "string" ? record.detail : undefined;

  let errors: ProblemDetailsDto["errors"] | undefined;

  if (Array.isArray(record.errors))
  {
    const entries = record.errors.filter(
      (entry): entry is Record<string, unknown> =>
        entry !== null && typeof entry === "object",
    );

    const validEntries = entries.filter(
      (entry) =>
        typeof entry.field === "string" && typeof entry.code === "string",
    );

    errors = validEntries.map((entry) => ({
      field: entry.field as string,
      code: entry.code as string,
    }));
  }

  return { title, status, detail, errors };
}
