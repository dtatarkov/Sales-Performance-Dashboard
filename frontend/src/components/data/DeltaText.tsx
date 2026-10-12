"use client";

import type { Delta } from "../../types/delta";
import { formatDelta } from "../../formatters/formatDelta";

/**
 * Цвет текста Δ по семантике Color (токены globals.css).
 */
const TEXT_COLOR_CLASS: Record<string, string> = {
  neutral: "text-text-tertiary",
  positive: "text-success",
  negative: "text-danger",
};

/**
 * Тип props DeltaText — текстовая Δ без фона (макет docs/archive/dashboard.html:
 * `.lb-l2-delta`, `.kpi-delta` — цветной текст, не плашка).
 */
type DeltaTextProps = {
  /** Структура Δ или null (недостаточно данных → «—»). */
  delta: Delta | null;
  /** «Плохая» метрика (возвраты/отмены): рост — красный, падение — зелёный. */
  negative?: boolean;
  /** Дополнительные классы (размер/вес для конкретного блока). */
  className?: string;
};

/**
 * DeltaText — Δ цветным текстом, без фона и бордера: «▲ +12,4%» / «▼ −0,4
 * п.п.» / «—». Формат — formatDelta (ui.md, «Тип Delta»), цвет — по
 * семантике метрики, которую решает вызывающий. Размер не задаётся —
 * определяет контекст (ui.md: метрика уровня 2 — 10px, KPI — 12px).
 *
 * @param props Δ, флаг «плохой» метрики, доп. классы.
 * @returns текст Δ.
 */
export function DeltaText({ delta, negative = false, className = "" }: DeltaTextProps) {
  const formatted = formatDelta(delta, negative);

  const colorClass = TEXT_COLOR_CLASS[formatted.color] ?? "";

  const textClassName = className === ""
    ? colorClass
    : `${className} ${colorClass}`;

  return <span className={textClassName}>{formatted.text}</span>;
}
