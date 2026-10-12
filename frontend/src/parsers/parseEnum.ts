import { ParseError } from "../errors/parseError";

/**
 * Универсальный парсер числового enum на границе api (frontend-plan.md, этап 2):
 * неизвестное значение → ParseError, а не «тихий» default — баг-детектор
 * рассинхрона с api.md.
 *
 * @param raw сырое значение поля (число enum).
 * @param source имя поля/сущности для сообщения об ошибке.
 * @param dictionary словарь допустимых значений enum → результат.
 * @returns значение строкового union.
 * @throws ParseError при значении вне словаря.
 */
export function parseEnum<TValue extends number, TResult>(
  raw: number,
  source: string,
  dictionary: Readonly<Record<TValue, TResult>>,
): TResult
{
  const mapped = (dictionary as Record<number, TResult | undefined>)[raw];

  if (mapped === undefined)
  {
    throw new ParseError(
      source,
      `Неизвестное значение enum ${source}: ${raw}`,
    );
  }

  return mapped;
}