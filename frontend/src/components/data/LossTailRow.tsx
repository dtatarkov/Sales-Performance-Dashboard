"use client";

import { formatMoney } from "../../formatters/formatMoney";
import { formatPercent } from "../../formatters/formatPercent";
import type { LossTailData } from "../../types/dashboard";

/** Класс строки хвоста (макет .loss-row.tail: italic, без бара, secondary). */
const ROW_CLASS =
  "flex min-h-[26px] items-center gap-2 py-[3px] text-[13px]";

/** Класс пустого индекса хвоста — держит сетку строк (18px). */
const RANK_PLACEHOLDER_CLASS = "w-[18px] shrink-0";

/** Класс текста «Остальные N» (макет: italic, medium, secondary). */
const NAME_CLASS =
  "min-w-0 flex-1 truncate whitespace-nowrap font-medium italic text-text-secondary";

/** Класс пустого трека — сетка колонок без серого фона (макет .tail). */
const TRACK_PLACEHOLDER_CLASS = "h-3 w-[60px] shrink-0";

/** Класс суммы хвоста (макет .loss-row.tail .loss-sum: semibold, italic). */
const SUM_CLASS =
  "min-w-[80px] shrink-0 text-right font-semibold italic tabular-nums whitespace-nowrap text-text-secondary";

/** Класс доли хвоста (макет .loss-share, приглушённый). */
const SHARE_CLASS =
  "min-w-[46px] shrink-0 text-right text-[11px] font-semibold italic tabular-nums text-accent";

/**
 * Тип props LossTailRow — хвост «Остальные N» группы потерь (ui.md, блок 10).
 */
type LossTailRowProps = {
  /** Данные хвоста. */
  tail: LossTailData;
};

/**
 * LossTailRow — хвост «Остальные N» группы потерь (макет renderLosses):
 * без бара (правило макета), сумма и доля в тех же колонках, что у строк
 * топа; курсив и приглушение — стильно отличают хвост.
 *
 * @param props данные хвоста.
 * @returns строку хвоста.
 */
export function LossTailRow({ tail }: LossTailRowProps) {
  const valueLabel = formatMoney(tail.valueAbsolute);

  const shareLabel = formatPercent(tail.valueRelative);

  return (
    <div className={ROW_CLASS}>
      <span className={RANK_PLACEHOLDER_CLASS} />

      <span className={NAME_CLASS}>Остальные {tail.count}</span>

      <span className={TRACK_PLACEHOLDER_CLASS} />

      <span className={SUM_CLASS}>{valueLabel}</span>

      <span className={SHARE_CLASS}>{shareLabel}</span>
    </div>
  );
}
