"use client";

import type { Contribution } from "../../types/contribution";
import { useTransitionValue } from "../../hooks/ui/useTransitionValue";
import { formatMoney } from "../../formatters/formatMoney";
import { formatNumber } from "../../formatters/formatNumber";
import { formatContributionLabel } from "../../formatters/formatContributionLabel";
import { paletteColorOf } from "../../configuration/colorPalette";
import { CHART_ANIMATION } from "../../configuration/charts";

/**
 * Тип props ContributionBar — правый блок строки рейтинга/топа (frontend.md
 * §7; ui.md: «Бар — valueNormalized из contribution активного датасета,
 * приходит готовым»).
 */
type ContributionBarProps = {
  /** Готовый вклад элемента (valueAbsolute/valueNormalized/valueRelative). */
  contribution: Contribution;
  /** Единица крупного значения: money (₽) или счётчик (шт). */
  valueUnit: "money" | "count";
  /** Индекс цвета из единой палитры (позиция датасета). */
  seriesIndex: number;
};

/** Класс трека (макет .lb-bar-wrap: 90px, высота 4px, серая подложка --track). */
const TRACK_CLASS = "h-1 w-[90px] overflow-hidden rounded-[2px] bg-track";

/** Класс заполнения трека (макет .lb-bar: рост слева направо). Ширина
    анимируется — при смене датасета бар перетекает в новую длину
    (ui.md, «Анимации»; длительность — CHART_ANIMATION). */
const FILL_CLASS = `block h-full transition-[width] ${CHART_ANIMATION.durationClass}`;

/** Класс крупного значения (макет .lb-val: 13px, bold, right, min 80px). */
const VALUE_CLASS = "min-w-20 text-right text-[13px] font-bold tabular-nums text-text-primary";

/** Класс вклада (макет .lb-contribution: 11px, accent, right, semibold). */
const CONTRIBUTION_CLASS = "text-[11px] font-semibold text-accent";

/**
 * Форматирует крупное значение вклада по единице: деньги — formatMoney
 * (сокращения тыс/млн), счётчик — разделители тысяч и суффикс «шт»
 * (макет tp-value: «1 245 шт»).
 *
 * @param value значение.
 * @param unit единица.
 * @returns строка значения.
 */
function formatValue(value: number, unit: "money" | "count"): string {
  if (unit === "money") {
    return formatMoney(value);
  }

  return `${formatNumber(value)} шт`;
}

/**
 * ContributionBar — правый блок строки уровня 1 (ui.md, строки рейтингов
 * и топов): трек 90px + крупное значение в ряд, вклад — под значением
 * акцентным цветом, выровнен вправо (макет .lb-nums/.lb-contribution).
 * Бар — визуальный масштаб значения (valueNormalized 0–100), не доля;
 * длина не вычисляется на клиенте. Длина анимируется переходом
 * prev → current (useTransitionValue + CHART_ANIMATION).
 *
 * @param props вклад, единица значения, серия цвета.
 * @returns трек со значением и вкладом.
 */
export function ContributionBar({
  contribution,
  valueUnit,
  seriesIndex,
}: ContributionBarProps) {
  const seriesColor = paletteColorOf(seriesIndex);

  // Двухфазное значение длины бара: рендер остаётся на prev-длине, целевая
  // подставляется кадром позже — transition проигрывается строго prev →
  // current, без стартового прыжка при приходе новых данных (SWR, смена
  // датасета).
  const displayedBarValue = useTransitionValue(contribution.valueNormalized);

  const barStyle = {
    width: `${Math.max(displayedBarValue, 0)}%`,
    backgroundColor: seriesColor,
  } as const;

  const valueText = formatValue(contribution.valueAbsolute, valueUnit);

  const contributionLabel = formatContributionLabel(contribution);

  return (
    <div className="flex shrink-0 flex-col items-end gap-0.5">
      <div className="flex items-center gap-2.5">
        <span className={TRACK_CLASS}>
          <span className={FILL_CLASS} style={barStyle} />
        </span>

        <span className={VALUE_CLASS}>
          {valueText}
        </span>
      </div>

      <span className={CONTRIBUTION_CLASS}>
        {contributionLabel}
      </span>
    </div>
  );
}