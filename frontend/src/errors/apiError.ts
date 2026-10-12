/**
 * Ошибка транспорта: сетевой сбой или неуспешный HTTP-ответ 400/500
 * (ProblemDetails, api.md «Ошибки»). Создаётся только конвейером
 * api/request.ts.
 *
 * Отдельный от ParseError класс без общего предка: причины отказа разные —
 * сбой транспорта против рассинхрона контракта, общих сценариев обработки
 * у них нет.
 */
export class ApiError extends Error
{
  /** HTTP-статус ответа; null — сетевой сбой без ответа. */
  readonly status: number | null;
  /** Код ошибки api.md (PERIOD_REQUIRED, …); null — не разобран. */
  readonly code: string | null;

  /**
   * Создаёт ошибку транспорта.
   *
   * @param status HTTP-статус или null при сетевом сбое.
   * @param code код ошибки api.md или null.
   * @param message человекочитаемое сообщение (для toast'ов).
   */
  constructor(status: number | null, code: string | null, message: string)
  {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}
