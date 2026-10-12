import type { DeltaDto } from "../types/dto";
import type { Delta } from "../types/delta";
import { parseNumber } from "../parsers/parseNumber";
import { mapDeltaUnit } from "./enumMappers";

/**
 * Маппинг Δ DTO → app-Delta; null проходит как есть — Δ не вычисляется
 * (конвенция null ≠ 0, api.md; хитрое место №2 frontend-plan.md).
 *
 * @param raw поле delta DTO или null.
 * @param source имя поля для сообщений парсеров.
 * @returns Delta или null.
 */
export function mapDelta(raw: DeltaDto | null, source: string): Delta | null
{
  if (raw === null)
  {
    return null;
  }

  const value = parseNumber(raw.value, `${source}.value`);
  const rawUnit = parseNumber(raw.unit, `${source}.unit`);
  const unit = mapDeltaUnit(rawUnit);

  return { value, unit };
}
