"use client";

import { useRef } from "react";

import { DeltaBadge } from "../../components/data/DeltaBadge";
import { CardFade } from "../../components/ui/CardFade";
import { Sparkline } from "../../components/data/Sparkline";
import { useAnimatedCounter } from "../../hooks/ui/useAnimatedCounter";
import { useScrollFade } from "../../hooks/ui/useScrollFade";
import { formatMoney } from "../../formatters/formatMoney";
import { formatPercent } from "../../formatters/formatPercent";
import { paletteColorOf } from "../../configuration/colorPalette";
import { LossTopRow } from "../../components/data/LossTopRow";
import { LossTailRow } from "../../components/data/LossTailRow";
import type { LossGroupData } from "../../types/dashboard";

/** Цвет sparkline группы потерь — 3-й цвет единой палитры (ui.md). */
const SPARKLINE_COLOR_INDEX = 2;

/** Класс крупного числа суммы группы (макет .loss-big: 24px, extrabold). */
const BIG_VALUE_CLASS = "text-2xl font-extrabold tabular-nums text-text-primary";

/** Класс блока доли (макет .loss-rate: 14px, bold). */
const RATE_CLASS = "flex items-baseline gap-1 whitespace-nowrap text-sm font-bold tabular-nums text-text-primary";

/** Класс подписи «доля» (макет .loss-rate .lbl: 11px, medium, secondary). */
const RATE_LABEL_CLASS = "text-[11px] font-medium text-text-secondary";

/** Подпись перед долей группы (макет: «доля» — у обеих групп потерь). */
const RATE_LABEL = "доля";

/** Класс заголовка топа (макет .loss-top-h: 10.5px, caps, secondary). */
const TOP_HEADER_CLASS =
  "mt-2 text-[10.5px] uppercase tracking-wide text-text-secondary";

/**
 * Общий подвиджет групп потерь (frontend-plan.md, этап 9, п.3; ui.md, блок
 * 10): крупное число (анимированный счётчик), доля с подписью «доля» + Δ в
 * п.п., sparkline, заголовок топа, топ + хвост «Остальные N» (сумма долей →
 * 100%).
 *
 * Хвост печатается без бара (ui.md); акцента строк нет — строка показывает
 * долю от утечки группы.
 *
 * @param props данные группы и заголовок топа.
 * @returns контент группы потерь.
 */
export function LossGroupContent({
  data,
  topHeader,
}: {
  data: LossGroupData;
  /** Заголовок над списком топа (макет: «Топ товаров…»/«Топ менеджеров…»). */
  topHeader: string;
}) {
  const animatedValue = useAnimatedCounter(data.value);

  const sparklineValues = data.series.map((point) => point.value);

  const sparklineColor = paletteColorOf(SPARKLINE_COLOR_INDEX);

  // Fade и скролл живут на списке топа (скролл по таблице, не по всей
  // карточке); updateKey — данные группы, чтобы fade пересчитывался при
  // смене периода/сегмента.
  const topListRef = useRef<HTMLDivElement | null>(null);

  const fadeVisible = useScrollFade(topListRef, data);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className={BIG_VALUE_CLASS}>
          {formatMoney(Math.round(animatedValue))}
        </span>

        <span className={RATE_CLASS}>
          <span className={RATE_LABEL_CLASS}>{RATE_LABEL}</span>

          <span>{formatPercent(data.rate)}</span>

          <DeltaBadge delta={data.rateDelta} negative />
        </span>
      </div>

      <Sparkline
        values={sparklineValues}
        color={sparklineColor}
      />

      <div className={TOP_HEADER_CLASS}>{topHeader}</div>

      {/* Скроллится только список: шапка группы (число/доля/sparkline) и
          заголовок топа закреплены (скролл по таблице). Fade — sibling
          скроллера, не внутри: absolute bottom-0 внутри скроллящегося
          div привязывается к низу контента и уезжает при прокрутке. */}
      <div className="relative min-h-0 flex-1">
        <div ref={topListRef} className="h-full overflow-y-auto pr-2">
          <div className="flex flex-col">
            {/* Ключ — индекс: строки не размонтируются, бар доли
                перетекает prev → current (README, «UI-правила»). */}
            {data.top.map((item, index) => (
              <LossTopRow
                key={index}
                item={item}
                index={index}
              />
            ))}

            {data.tail !== null && <LossTailRow tail={data.tail} />}
          </div>
        </div>

        {fadeVisible && <CardFade />}
      </div>
    </div>
  );
}