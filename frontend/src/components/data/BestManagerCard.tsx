"use client";

import { Avatar } from "../ui/Avatar";
import { DeltaText } from "./DeltaText";
import { Sparkline } from "./Sparkline";
import { useAnimatedCounter } from "../../hooks/ui/useAnimatedCounter";
import { formatMoney } from "../../formatters/formatMoney";
import { formatNumber } from "../../formatters/formatNumber";
import { kpiColorOf } from "../../configuration/kpiColors";
import type { BestManagerData } from "../../types/dashboard";

/** Высота KPI-карточки — токен globals.css. */
const KPI_HEIGHT = "var(--kpi-height)";

/** Класс KPI-карточки. */
const KPI_CARD_CLASS =
  "flex flex-col rounded-xl border border-border bg-surface p-4";

/** Класс подписи KPI-карточки (макет .kpi-label: капс 11px, тертиарный). */
const LABEL_CLASS = "text-[11px] font-medium uppercase tracking-wide text-text-tertiary";

/** Класс подписи «данных нет» пустой карточки (макет state 4: 13px,
    тертиарный, отступ сверху 8px). */
const EMPTY_HINT_CLASS = "mt-2 text-[13px] text-text-tertiary";

/** Класс ряда «аватар + подписи» (макет .top-mgr: отступ сверху 4px; зазор
    аватар → контент увеличен — 16px). */
const TOP_MGR_CLASS = "mt-1 flex items-center gap-4";

/** Класс блока подписей: строки прижаты к левому краю, блок занимает
    оставшееся место справа от аватара. */
const INFO_CLASS = "flex min-w-0 flex-1 flex-col items-start";

/** Класс имени (макет .top-mgr-info: 0.85rem, semibold). */
const NAME_CLASS = "truncate text-[13px] font-semibold text-text-primary";

/** Класс вторичной строки (макет .top-mgr-sub: 0.72rem, secondary). */
const SUB_CLASS = "text-[11px] text-text-secondary";

/** Отступы между подписями (макет: имя → ВП → продажи, 3px). */
const SUB_GAP_CLASS = "mt-[3px]";

/** Класс Δ-строки (макет .mgr-delta: 0.72rem semibold, отступ сверху 6px). */
const DELTA_CLASS = "mt-1.5 text-[11px] font-semibold";

/**
 * Тип props BestManagerCard — карточка «Лучший менеджер» (ui.md, блок 1).
 * data === null → карточка «данных нет» — та же рамка и подпись, что у
 * остальных KPI-карточек (макет state 4).
 */
type BestManagerCardProps = {
  /** Данные лидера; null — продаж за период не было. */
  data: BestManagerData | null;
  /** Номер цвета KPI-серии (1–6) — цвет sparkline. */
  colorIndex: number;
};

/**
 * BestManagerCard — карточка «Лучший менеджер» (ui.md, блок 1) по макету
 * `.top-mgr`: аватар/инициалы, справа стопкой — имя (0.85rem), «ВП: …»
 * (0.72rem), «продажи: …» (0.72rem), Δ ВП цветным текстом (DeltaText);
 * sparkline прижат к низу карточки.
 *
 * Пустой период: обычная карточка с подписью «Лучший менеджер» и строкой
 * «данных нет» — визуально совпадает с остальными KPI-карточками
 * (макет state 4 в docs/archive/dashboard-states.html).
 *
 * @param props данные лидера или null, номер цвета.
 * @returns карточку лидера.
 */
export function BestManagerCard({ data, colorIndex }: BestManagerCardProps) {
  // Хук до раннего return: rules-of-hooks (значение нужно только в ветке
  // «есть лидер», но порядок вызовов должен быть стабильным).
  const animatedGp = useAnimatedCounter(data?.gp ?? 0);
  const color = kpiColorOf(colorIndex);
  const cardStyle = { height: KPI_HEIGHT } as const;

  if (data === null) {
    return (
      <div
        className={KPI_CARD_CLASS}
        style={cardStyle}
      >
        <span className={LABEL_CLASS}>
          Лучший менеджер
        </span>

        <span className={EMPTY_HINT_CLASS}>
          данных нет
        </span>
      </div>
    );
  }

  const sparklineValues = data.series.map((point) => point.value);
  const animatedGpLabel = formatMoney(Math.round(animatedGp));
  const gpLine = `ВП: ${animatedGpLabel}`;

  const salesCountLabel = formatNumber(data.salesCount);
  const salesLine = `продажи: ${salesCountLabel}`;

  const infoNode = (
    <span className={INFO_CLASS}>
      <span className={NAME_CLASS}>{data.name}</span>

      <span className={`${SUB_CLASS} ${SUB_GAP_CLASS} block truncate`}>
        {gpLine}
      </span>

      <span className={`${SUB_CLASS} ${SUB_GAP_CLASS} block truncate`}>
        {salesLine}
      </span>

      <DeltaText
        delta={data.delta}
        className={DELTA_CLASS}
      />
    </span>
  );

  return (
    <div
      className={KPI_CARD_CLASS}
      style={cardStyle}
    >
      <span className={LABEL_CLASS}>
        Лучший менеджер
      </span>

      <div className={TOP_MGR_CLASS}>
        <Avatar
          name={data.name}
          initials={data.initials}
          avatar={data.avatar}
          size={36}
        />

        {infoNode}
      </div>

      <div className="mt-auto">
        <Sparkline
          values={sparklineValues}
          color={color}
        />
      </div>
    </div>
  );
}
