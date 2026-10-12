import type { Contribution } from "../types/contribution";
import { formatMultiplier } from "./formatDelta";
import { formatPercent } from "./formatPercent";
import { MISSING_VALUE_MARKER } from "../configuration/missingValueMarker";

/**
 * Подпись вклада элемента по `valueRelativeUnit` (ui.md, «Тип Contribution»;
 * макет: «26,2% от ВП периода», «1,7× к среднему чеку»): `gp` →
 * «26,2% от ВП периода», `revenue` → «17,6% от выручки периода»,
 * `units` → «12,3% от объёма периода», `ac` → «1,7× к среднему чеку».
 * `valueRelative: null` — вклад не определён (пустой период) → «—»
 * (конвенция null ≠ 0, api.md).
 *
 * @param contribution вклад элемента.
 * @returns строка подписи вклада.
 */
export function formatContributionLabel(contribution: Contribution): string
{
  if (contribution.valueRelative === null)
  {
    return MISSING_VALUE_MARKER;
  }

  if (contribution.valueRelativeUnit === "ac")
  {
    const multiplier = formatMultiplier(contribution.valueRelative);

    return `${multiplier} к среднему чеку`;
  }

  const share = formatPercent(contribution.valueRelative);
  const unitLabel = unitLabelOf(contribution.valueRelativeUnit);

  return `${share} ${unitLabel}`;
}

/**
 * Русская подпись единицы аддитивного вклада — доля от итога периода.
 *
 * @param unit единица вклада (аддитивная: gp/revenue/units).
 * @returns «от ВП периода» / «от выручки периода» / «от объёма периода».
 */
function unitLabelOf(unit: "gp" | "revenue" | "units"): string
{
  const label = unit === "gp"
    ? "от ВП периода"
    : unit === "revenue"
      ? "от выручки периода"
      : "от объёма периода";

  return label;
}