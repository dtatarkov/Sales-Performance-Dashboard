"use client";

import { ButtonGroup } from "./ButtonGroup";
import type { CustomerSegment } from "../../types/customerSegment";

/**
 * Тип props SegmentSelect — выбор сегмента тулбара (frontend.md, §4: наружу
 * только события; ui.md, «Тулбар», правый край — «для кого»).
 */
type SegmentSelectProps = {
  /** Активный сегмент или null (все сегменты). */
  segment: CustomerSegment | null;
  /** Выбор сегмента; null — снятие выбора (все сегменты). */
  onSegmentSelect: (segment: CustomerSegment | null) => void;
};

/** Опции сегмента (ui.md, «Сегмент клиента»; подписи — domain.md). */
const SEGMENT_OPTIONS = [
  { value: "enterprise", label: "Крупный бизнес" },
  { value: "mid-market", label: "Средний бизнес" },
  { value: "smb", label: "Малый бизнес" },
] as const;

/**
 * SegmentSelect — выбор сегмента тулбара (ui.md, «Тулбар»): ButtonGroup
 * с deselect («один или ни одного»). Render-only: только событие, сборку
 * query выполняет виджет.
 *
 * @param props активный сегмент и событие выбора.
 * @returns контрол выбора сегмента.
 */
export function SegmentSelect({ segment, onSegmentSelect }: SegmentSelectProps) {
  return (
    <ButtonGroup
      options={SEGMENT_OPTIONS}
      value={segment}
      onChange={onSegmentSelect}
      allowDeselect
      ariaLabel="Сегмент клиента"
    />
  );
}
