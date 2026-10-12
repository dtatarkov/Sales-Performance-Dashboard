"use client";

import { DeltaText } from "./DeltaText";
import type { Delta } from "../../types/delta";

/** Фиксированный стиль Δ-бейджа: компактный (10px, semibold, табличные
    цифры) — блоки потерь и легенда категорий, где Δ всегда одной строки. */
const DELTA_BADGE_CLASS =
  "whitespace-nowrap text-[10px] font-semibold tabular-nums";

/**
 * Тип props DeltaBadge — Δ-метка метрики (frontend.md §7, элементы данных):
 * текст форматируется formatDelta, цвет — по семантике метрики, которую
 * решает вызывающий (ui.md, «Цвет Δ»).
 */
type DeltaBadgeProps = {
  /** Структура Δ или null (недостаточно данных → «—»). */
  delta: Delta | null;
  /** «Плохая» метрика (возвраты/отмены): рост — красный, падение — зелёный. */
  negative?: boolean;
};

/**
 * DeltaBadge — компактная Δ в одну строку: тонкая обёртка над DeltaText
 * с фиксированным стилем (10px, semibold, табличные цифры, без переноса);
 * формат и цвет — общие с DeltaText (один словарь цвета, formatDelta).
 *
 * @param props Δ и флаг «плохой» метрики.
 * @returns метку Δ.
 */
export function DeltaBadge({ delta, negative = false }: DeltaBadgeProps) {
  return (
    <DeltaText
      delta={delta}
      negative={negative}
      className={DELTA_BADGE_CLASS}
    />
  );
}
