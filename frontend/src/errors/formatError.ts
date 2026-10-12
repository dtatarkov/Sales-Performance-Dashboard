/**
 * Ошибка форматирования значения для показа: форматтер получил значение,
 * для которого невозможно построить корректную строку. Создаётся только
 * форматтерами utils/ (баг-детектор, а не «тихий» fallback).
 */
export class FormatError extends Error
{
  /** Имя сущности/операции форматирования для сообщения об ошибке. */
  readonly source: string;

  /**
   * Создаёт ошибку форматирования.
   *
   * @param source имя сущности/операции для сообщения об ошибке.
   * @param message человекочитаемое сообщение (для toast'ов).
   */
  constructor(source: string, message: string)
  {
    super(message);

    this.name = "FormatError";
    this.source = source;
  }
}
