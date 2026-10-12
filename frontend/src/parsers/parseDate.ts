import { ParseError } from "../errors/parseError";

/**
 * Парсер datetime-полей DTO (api.md: все даты — datetime ISO 8601 UTC).
 * Защита границы: сервер присылает строку, TS-типы этого не проверяют.
 *
 * @param raw сырое значение поля (строка ISO 8601).
 * @param source имя поля для сообщения об ошибке.
 * @returns объект Date.
 * @throws ParseError, если поле не строка или не парсится в дату.
 */
export function parseDate(raw: unknown, source: string): Date
{
  if (typeof raw !== "string")
  {
    throw new ParseError(
      source,
      `Поле ${source} должно быть ISO-строкой даты, получено: ${typeof raw}`,
    );
  }

  const parsed = new Date(raw);

  if (Number.isNaN(parsed.getTime()))
  {
    throw new ParseError(
      source,
      `Поле ${source} содержит невалидную дату: ${raw}`,
    );
  }

  return parsed;
}