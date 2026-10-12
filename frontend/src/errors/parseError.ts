/**
 * Ошибка маппинга DTO: рассинхрон контракта с api.md — поле не того типа,
 * невалидная дата или неизвестное значение enum. Создаётся только парсерами
 * parsers/ (баг-детектор, а не «тихий» default).
 */
export class ParseError extends Error
{
  /** Имя поля/сущности DTO, на котором сорвался маппинг (например, `kpi.revenue.value`). */
  readonly source: string;

  /**
   * Создаёт ошибку маппинга DTO.
   *
   * @param source имя поля/сущности для сообщения об ошибке.
   * @param message человекочитаемое сообщение (для toast'ов).
   */
  constructor(source: string, message: string)
  {
    super(message);

    this.name = "ParseError";
    this.source = source;
  }
}
