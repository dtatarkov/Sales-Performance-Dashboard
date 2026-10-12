import { ParseError } from "../errors/parseError";

/**
 * Парсер числа на границе api — защита от null там, где DTO допускает
 * `T | null`, но вызывающий контекст требует число (api.md, конвенция null ≠ 0
 * соблюдается мапперами: nullable-поля проходят как есть, этот парсер —
 * для обязательных числовых полей).
 *
 * @param raw сырое значение поля.
 * @param source имя поля для сообщения об ошибке.
 * @returns число.
 * @throws ParseError, если поле не число.
 */
export function parseNumber(raw: unknown, source: string): number
{
  if (typeof raw !== "number" || Number.isNaN(raw))
  {
    throw new ParseError(
      source,
      `Поле ${source} должно быть числом, получено: ${typeof raw}`,
    );
  }

  return raw;
}

/**
 * Парсер nullable-числа: проходит null как есть (конвенция null ≠ 0), число —
 * проверяет (api.md, «Конвенция null vs 0»).
 *
 * @param raw сырое значение nullable-поля.
 * @param source имя поля для сообщения об ошибке.
 * @returns число или null.
 * @throws ParseError, если значение не число и не null.
 */
export function parseNullableNumber(raw: unknown, source: string): number | null
{
  if (raw === null)
  {
    return null;
  }

  return parseNumber(raw, source);
}