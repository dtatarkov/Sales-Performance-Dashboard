import type { ContributionDto } from "../types/dto";
import type { Contribution } from "../types/contribution";
import { parseNullableNumber, parseNumber } from "../parsers/parseNumber";
import { mapContributionUnit } from "./enumMappers";

/**
 * Маппинг ContributionDto → Contribution с проверкой всех полей; null
 * у valueRelative проходит как есть — вклад не определён, не чинится нулём
 * (конвенция null ≠ 0, api.md; хитрое место №2 frontend-plan.md).
 *
 * @param raw вклад DTO.
 * @param source имя поля для сообщений парсеров.
 * @returns Contribution app-типа.
 */
export function mapContribution(
  raw: ContributionDto,
  source: string,
): Contribution
{
  const valueAbsolute = parseNumber(
    raw.valueAbsolute,
    `${source}.valueAbsolute`,
  );

  const valueRelative = parseNullableNumber(
    raw.valueRelative,
    `${source}.valueRelative`,
  );
  const rawUnit = parseNumber(raw.valueRelativeUnit, `${source}.valueRelativeUnit`);
  const valueRelativeUnit = mapContributionUnit(rawUnit);

  const valueNormalized = parseNumber(
    raw.valueNormalized,
    `${source}.valueNormalized`,
  );

  return {
    valueAbsolute,
    valueRelative,
    valueRelativeUnit,
    valueNormalized,
  };
}
