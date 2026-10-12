"use client";

import { useTransitionValue } from "../../hooks/ui/useTransitionValue";
import { formatArrowDelta, formatArrowMoney } from "../../formatters/formatDelta";
import { CHART_ANIMATION } from "../../configuration/charts";
import { DYNAMICS_SECTION_SIZE } from "../../configuration/dynamics";
import type { Delta } from "../../types/delta";

/**
 * Строка данных дивергентного графика — абстракция ui-слоя: компонент не
 * знает о доменных моделях блока 5, получает только то, что рисует.
 */
export type DynamicsChartItem = {
  /** Уникальный ключ строки (id клиента). */
  id: string;
  /** Имя слева от бара. */
  name: string;
  /** Длина бара, 0–100 (доля максимума своей секции). */
  barValue: number;
  /** Первая строка подписи у бара — абсолютная Δ деньгами. */
  absoluteDelta: number;
  /** Вторая строка подписи — относительная Δ; null печатается прочерком. */
  delta: Delta | null;
};

/** Цвет бара роста (ui.md, блок 5: семантика метрик результата). */
const GROWTH_COLOR = "var(--success)";

/** Цвет бара падения. */
const DECLINE_COLOR = "var(--danger)";

/** Класс строки-заголовка секции (макет .dyn-sec: 10px, bold, caps, tertiary). */
const SECTION_TITLE_CLASS =
  "flex h-5 items-center text-[10px] font-bold uppercase tracking-wide text-text-tertiary";

/** Класс имени клиента (макет .dyn-name: 11.5px, основный текст). */
const NAME_CLASS = "w-32 shrink-0 truncate text-xs text-text-primary";

/** Класс скорости transition баров и подписей — единая константа чартов
    (configuration/charts.ts, CHART_ANIMATION); easing — style, из той же
    константы (transition-timing-function не параметризуется классом). */
const DURATION_CLASS = CHART_ANIMATION.durationClass;

/** Класс бара строки (макет .dyn-bar: 12px высотой, скруглённый). Ширина
    анимируется: при смене метрики/периода бар «переливается» в новую длину,
    а не прыгает (ui.md, «Анимации»: transition width/появление). */
const BAR_CLASS = `absolute top-1/2 h-3 -translate-y-1/2 rounded-[3px] transition-[width] ${DURATION_CLASS}`;

/** Класс подписи Δ у конца бара (макет .dyn-val): столбик из двух строк —
    абсолютная сверху, относительная снизу; 11px, semibold, по семантике.
    Позиция анимируется вместе с концом бара (transition left/right). */
const DELTA_LABEL_CLASS = `absolute top-1/2 flex -translate-y-1/2 flex-col gap-0.5 whitespace-nowrap text-[11px] font-semibold transition-[left,right] ${DURATION_CLASS}`;

/** Резерв ширины подписи Δ: деньги формата «+35 тыс ₽» шире процентов
    (макет: подписи не наезжают на соседнюю строку). */
const DELTA_RESERVE_CLASS = "w-24 shrink-0";

/** Ширина колонки имён, rem (w-32). */
const NAME_WIDTH_REM = 8;

/** Резерв подписи Δ, rem (w-24). */
const DELTA_RESERVE_REM = 6;

/** Зазор между детьми строки, rem (gap-2). */
const ROW_GAP_REM = 0.5;

/** Сдвиг начала зоны баров от левого края контента, rem: имя + один зазор. */
const ZONE_OFFSET_REM = NAME_WIDTH_REM + ROW_GAP_REM;

/** Полная ширина строки вне зоны баров, rem: имя + резерв Δ + два зазора. */
const ZONE_OUTER_REM = NAME_WIDTH_REM + DELTA_RESERVE_REM + ROW_GAP_REM * 2;

/**
 * Позиция нулевой линии: центр зоны баров — по геометрии строки
 * (макет: нулевая линия по центру области баров).
 */
const ZERO_LINE_LEFT = `calc(${ZONE_OFFSET_REM}rem + (100% - ${ZONE_OUTER_REM}rem) / 2)`;

/** Размер секции «Рост»/«Падение» — Dyn Top N (configuration/dynamics.ts). */
const SECTION_SIZE = DYNAMICS_SECTION_SIZE;

/**
 * Дополняет секцию пустыми слотами до размера секции: геометрия секций
 * фиксирована — пустые слоты резервируют высоту строки (макет).
 *
 * @param items строки секции (готовые с сервера).
 * @returns слоты секции (null — пустой слот).
 */
function paddedSectionOf(items: DynamicsChartItem[]): Array<DynamicsChartItem | null>
{
  const padded: Array<DynamicsChartItem | null> = [];

  for (let index = 0; index < SECTION_SIZE; index += 1) {
    padded.push(items[index] ?? null);
  }

  return padded;
}

/**
 * Строка динамики (макет renderClientDynamics): имя слева, бар от нулевой
 * линии по центру зоны (рост — вправо, падение — влево), подпись у конца
 * бара в столбик — абсолютная Δ деньгами сверху, относительная Δ снизу,
 * цветом семантики. null-слот резервирует высоту строки. Ширина бара и
 * позиция подписи анимируются переходом prev → current (useTransitionValue
 * + CHART_ANIMATION): при смене датасета/периода значения меняются плавно,
 * без «прыжка» (ui.md, «Анимации»). Ключ строки задаёт виджет по id
 * клиента — React сохраняет DOM-узел, transition срабатывает.
 *
 * @param props строка данных или null, признак секции роста.
 * @returns строку секции.
 */
function DynamicsRow({ item, isGrowth }: { item: DynamicsChartItem | null; isGrowth: boolean }) {
  // Хук до раннего return по null-слоту: rules-of-hooks (тот же приём, что
  // в BestManagerCard — порядок вызовов обязан быть стабильным).
  const rawBarValue = item === null ? 0 : item.barValue;

  const displayedBarValue = useTransitionValue(rawBarValue);

  if (item === null) {
    return <div className="flex-1" />;
  }

  const barColor = isGrowth ? GROWTH_COLOR : DECLINE_COLOR;

  // Длина бара в процентах зоны: barValue — 0–100 от половины зоны.
  const barLengthPercents = displayedBarValue / 2;

  const barStyle = isGrowth
    ? { left: "50%", width: `${barLengthPercents}%`, backgroundColor: barColor }
    : { right: "50%", width: `${barLengthPercents}%`, backgroundColor: barColor };

  const absoluteText = formatArrowMoney(item.absoluteDelta);

  const relativeText = formatArrowDelta(item.delta);

  const deltaStyle = isGrowth
    ? { left: `calc(${50 + barLengthPercents}% + 6px)`, color: barColor }
    : { right: `calc(${50 + barLengthPercents}% + 6px)`, color: barColor };

  const transitionStyle = { transitionTimingFunction: CHART_ANIMATION.easing } as const;

  return (
    <div className="flex flex-1 items-center gap-2">
      <span className={NAME_CLASS}>{item.name}</span>

      <div className="relative h-full min-w-0 flex-1">
        <div className={BAR_CLASS} style={{ ...barStyle, ...transitionStyle }} />

        <span className={DELTA_LABEL_CLASS} style={{ ...deltaStyle, ...transitionStyle }}>
          <span>{absoluteText}</span>

          <span>{relativeText}</span>
        </span>
      </div>

      <span className={DELTA_RESERVE_CLASS} aria-hidden />
    </div>
  );
}

/**
 * Тип props DynamicsChart — данные дивергентного графика (ui.md, блок 5).
 */
type DynamicsChartProps = {
  /** Секция «Рост» активного датасета (готовый топ с сервера). */
  growth: DynamicsChartItem[];
  /** Секция «Падение» активного датасета (готовый топ с сервера). */
  decline: DynamicsChartItem[];
};

/**
 * DynamicsChart — дивергентный bar-chart динамики (макет
 * renderClientDynamics; ui.md, блок 5): две секции «Рост» и «Падение» по
 * Dyn Top N строк, общая пунктирная нулевая линия по центру зоны баров:
 * бары растут вправо (рост) и влево (падение); подпись у бара в столбик —
 * абсолютная Δ деньгами, относительная Δ; пустые слоты резервируют высоту
 * строк. Абстракция ui-слоя: работает с DynamicsChartItem, доменных
 * моделей не знает. Ключи строк — индексы слотов (жёсткий топ-NDyn):
 * DOM-узлы стабильны при любой смене состава, бар каждой строки всегда
 * морфится prev → current, новые клиенты «въезжают», а не появляются.
 *
 * @param props секции роста и падения активного датасета.
 * @returns график динамики.
 */
export function DynamicsChart({ growth, decline }: DynamicsChartProps) {
  const paddedGrowth = paddedSectionOf(growth);

  const paddedDecline = paddedSectionOf(decline);

  return (
    <div className="relative h-full">
      {/* Нулевая линия общая для обеих секций (макет: пунктир по центру
          зоны баров, ниже заголовка первой секции). */}
      <div
        aria-hidden
        className="absolute bottom-0 top-5 w-0 border-l border-dashed border-border"
        style={{ left: ZERO_LINE_LEFT }}
      />

      <div className="flex h-full flex-col">
        <div className={SECTION_TITLE_CLASS}>Рост</div>

        <div className="flex min-h-0 flex-1 flex-col">
          {paddedGrowth.map((item, index) => (
            <DynamicsRow
              key={`growth-${index}`}
              item={item}
              isGrowth={true}
            />
          ))}
        </div>

        <div className="my-2 border-t border-border" />

        <div className={SECTION_TITLE_CLASS}>Падение</div>

        <div className="flex min-h-0 flex-1 flex-col">
          {paddedDecline.map((item, index) => (
            <DynamicsRow
              key={`decline-${index}`}
              item={item}
              isGrowth={false}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
