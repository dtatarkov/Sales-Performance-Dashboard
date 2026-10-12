"use client";

import { MiniBar } from "../charts/MiniBar";
import { formatMoney } from "../../formatters/formatMoney";
import { formatPercent } from "../../formatters/formatPercent";
import type { LossTopItem } from "../../types/dashboard";

/** Класс строки топа потерь (макет .loss-row: flex, gap 8px, низ 1px —
    мягкий разделитель --divider-soft). */
const ROW_CLASS =
  "flex min-h-[26px] items-center gap-2 border-b border-divider-soft py-[3px] text-[13px] last:border-b-0";

/** Класс индекса строки (макет .loss-rank: tertiary, semibold, min 18px). */
const RANK_CLASS = "w-[18px] shrink-0 text-xs font-semibold text-text-tertiary";

/** Класс имени с подписью (макет .loss-obj: flex-1, ellipsis). */
const NAME_CLASS =
  "min-w-0 flex-1 truncate whitespace-nowrap text-text-primary";

/** Класс подписи имени (макет .loss-obj .sub: secondary, 11px). */
const SUBTITLE_CLASS = "text-[11px] text-text-secondary";

/** Класс суммы (макет .loss-sum: bold, right, min 80px). */
const SUM_CLASS =
  "min-w-[80px] shrink-0 text-right font-bold tabular-nums whitespace-nowrap text-text-primary";

/** Класс доли (макет .loss-share: accent, semibold, right, min 46px). */
const SHARE_CLASS =
  "min-w-[46px] shrink-0 text-right text-[11px] font-semibold tabular-nums text-accent";

/** Геометрия бара потерь (макет .loss-bar-wrap: 60×12, радиус 6). */
const BAR_WIDTH_PX = 60;

const BAR_HEIGHT_PX = 12;

const BAR_RADIUS_PX = 6;

/** Прозрачность заливки бара потерь (макет .loss-bar: opacity .75). */
const BAR_OPACITY = 0.75;

/**
 * Тип props LossTopRow — строка топа потерь (ui.md, блок 10).
 */
type LossTopRowProps = {
  /** Данные строки топа. */
  item: LossTopItem;
  /** Порядковый номер строки в топе (индекс #N). */
  index: number;
};

/**
 * LossTopRow — строка топа потерь (макет renderLosses): индекс #N, имя
 * с подписью (категория/команда), бар доли объекта 60px (valueNormalized
 * 0–100), сумма жирным, доля от суммы группы акцентом.
 *
 * @param props данные строки и её индекс.
 * @returns строку топа.
 */
export function LossTopRow({ item, index }: LossTopRowProps) {
  const valueLabel = formatMoney(item.valueAbsolute);

  const shareLabel = formatPercent(item.valueRelative);

  return (
    <div className={ROW_CLASS}>
      <span className={RANK_CLASS}>#{index + 1}</span>

      <span className={NAME_CLASS}>
        {item.name}

        {item.subtitle !== "" && (
          <span className={SUBTITLE_CLASS}> · {item.subtitle}</span>
        )}
      </span>

      <MiniBar
        width={BAR_WIDTH_PX}
        height={BAR_HEIGHT_PX}
        radius={BAR_RADIUS_PX}
        value={item.valueNormalized}
        color="var(--danger)"
        opacity={BAR_OPACITY}
      />

      <span className={SUM_CLASS}>{valueLabel}</span>

      <span className={SHARE_CLASS}>{shareLabel}</span>
    </div>
  );
}
