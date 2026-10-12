"use client";

import { useRef, useState } from "react";

import { BlockShell } from "../../components/ui/BlockShell";
import { CardFade } from "../../components/ui/CardFade";
import { EmptyState } from "../../components/ui/EmptyState";
import { TabControl } from "../../components/ui/TabControl";
import {
  DonutChart,
  categoryColorOf,
  type DonutSegment,
} from "../../components/charts/DonutChart";
import { DeltaBadge } from "../../components/data/DeltaBadge";
import { useHoverGroup } from "../../hooks/ui/useHoverGroup";
import { useScrollFade } from "../../hooks/ui/useScrollFade";
import { useCategories } from "../../hooks/domain/useCategories";
import { formatMoney } from "../../formatters/formatMoney";
import { formatNumber } from "../../formatters/formatNumber";
import { formatPercent } from "../../formatters/formatPercent";
import { CategoriesSkeleton } from "../../components/ui/CategoriesSkeleton";
import type { CategoryDataset, CategoryItem } from "../../types/dashboard";

/** Пустая иконка заглушки категорий. */
const EMPTY_ICON = (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="9" />

    <path d="M12 3v9l6.5 6" />
  </svg>
);

/** Опции переключателя метрики категорий (ui.md, блок 7). */
const METRIC_OPTIONS = [
  { value: "0", label: "Выручка" },
  { value: "1", label: "Валовая прибыль" },
];

/** Класс шапки легенды-таблицы (ui.md, блок 7). */
const LEGEND_HEADER_CLASS =
  "flex items-center gap-2 px-2 pb-1 text-[10px] uppercase tracking-wide text-text-tertiary";

/**
 * Строка легенды категорий (ui.md, блок 7): цветная точка, имя, выручка, ВП,
 * маржа, продажи — у каждого своя Δ. Hover строки подсвечивает сегмент
 * доната (useHoverGroup).
 *
 * @param props строка данных, индекс (цвет палитры), флаг подсветки, события hover.
 * @returns строка легенды.
 */
function CategoryLegendRow({
  item,
  index,
  highlighted,
  onHighlight,
  onClearHighlight,
}: {
  item: CategoryItem;
  index: number;
  highlighted: boolean;
  onHighlight: (id: string) => void;
  onClearHighlight: () => void;
}) {
  const rowClassName = highlighted
    ? "flex items-center gap-2 rounded-lg bg-border/40 px-2 py-1.5 text-xs"
    : "flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs";

  const handleMouseEnter = () => {
    onHighlight(item.id);
  };

  const handleMouseLeave = () => {
    onClearHighlight();
  };

  const dotStyle = { backgroundColor: categoryColorOf(index) } as const;

  return (
    <div
      className={rowClassName}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Цветная точка — палитра категорий (тот же индекс, что у сегмента). */}
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={dotStyle}
      />

      <span className="min-w-0 flex-1 truncate font-medium text-text-primary">
        {item.name}
      </span>

      <span className="w-20 shrink-0 text-right tabular-nums text-text-secondary">
        {formatMoney(item.revenue)}
      </span>

      <span className="w-24 shrink-0">
        <DeltaBadge delta={item.revenueDelta} />
      </span>

      <span className="w-20 shrink-0 text-right tabular-nums text-text-secondary">
        {formatMoney(item.gp)}
      </span>

      <span className="w-24 shrink-0">
        <DeltaBadge delta={item.gpDelta} />
      </span>

      <span className="w-14 shrink-0 text-right tabular-nums text-text-secondary">
        {formatPercent(item.margin)}
      </span>

      <span className="w-16 shrink-0 text-right tabular-nums text-text-secondary">
        {formatNumber(item.salesCount)}
      </span>
    </div>
  );
}

/**
 * Шапка легенды-таблицы: подписи колонок над строками (ui.md, блок 7).
 *
 * @returns шапка легенды.
 */
function LegendHeader() {
  return (
    <div className={LEGEND_HEADER_CLASS}>
      <span className="flex-1">Категория</span>

      <span className="w-20 shrink-0 text-right">Выручка</span>

      <span className="w-24 shrink-0" />

      <span className="w-20 shrink-0 text-right">ВП</span>

      <span className="w-24 shrink-0" />

      <span className="w-14 shrink-0 text-right">Маржа</span>

      <span className="w-16 shrink-0 text-right">Продаж</span>
    </div>
  );
}

/**
 * Собирает сегменты доната из активного датасета: id как имя, share
 * приходит готовым 0–100 (ui.md).
 *
 * @param dataset активный датасет категорий.
 * @returns сегменты доната.
 */
function segmentsOf(dataset: CategoryDataset<CategoryItem>): DonutSegment[]
{
  const segments = dataset.items.map((item) => ({
    name: item.id,
    share: item.share,
  }));

  return segments;
}

/**
 * Подпись активной метрики в центре доната (ui.md, блок 7).
 *
 * @param datasetIndex индекс активного датасета.
 * @returns подпись метрики.
 */
function centerMetricLabelOf(datasetIndex: number): string
{
  const label = datasetIndex === 0 ? "Выручка" : "Валовая прибыль";

  return label;
}

/**
 * Виджет блока 7 «Продажи по категориям» (frontend-plan.md, этап 9; ui.md,
 * блок 7): донат долей + легенда-таблица со скроллом. В центре доната —
 * активная метрика и сумма (datasets.total). Hover сегмента ↔ строки
 * легенды связывает useHoverGroup (один id на группу).
 *
 * Возвратов по категориям здесь нет (ui.md — единственный источник правды
 * по возвратам: «Лучшие продукты» и «Возвраты»).
 *
 * @returns блок категорий.
 */
export function CategoriesWidget() {
  const { data, isEmpty, isRefreshing } = useCategories();

  const [activeDatasetIndex, setActiveDatasetIndex] = useState(0);

  const hoverGroup = useHoverGroup();

  // Легенда скроллится внутри карточки (донат сверху статичен) — fade
  // вычисляется локально: ref на скроллящийся div легенды, ключ пересчёта —
  // активный датасет (смена метрики меняет состав строк).
  const legendRef = useRef<HTMLDivElement | null>(null);

  const legendFadeVisible = useScrollFade(legendRef, activeDatasetIndex);

  const handleMetricChange = (value: string | null) => {
    if (value !== null) {
      setActiveDatasetIndex(Number(value));
    }
  };

  const activeDataset =
    data !== null ? data.datasets[activeDatasetIndex] : null;

  const segments = activeDataset !== null ? segmentsOf(activeDataset) : [];

  const activeItems = activeDataset !== null ? activeDataset.items : [];

  const centerMetricLabel = centerMetricLabelOf(activeDatasetIndex);

  const activeTotal = activeDataset !== null ? activeDataset.total : 0;

  // Hover-связь донат ↔ легенда (ui.md, блок 7): сегмент кладёт в группу
  // id категории (name сегмента = item.id из segmentsOf), уход — сбрасывает.
  const handleSegmentEnter = (id: string) => {
    hoverGroup.highlight(id);
  };

  const handleSegmentLeave = () => {
    hoverGroup.clearHighlight();
  };

  const centerNode = (
    <>
      <span className="text-[11px] uppercase tracking-wide text-text-tertiary">
        {centerMetricLabel}
      </span>

      <span className="text-lg font-semibold tabular-nums text-text-primary">
        {formatMoney(activeTotal)}
      </span>
    </>
  );

  return (
    <BlockShell
      data={data}
      isEmpty={isEmpty}
      isRefreshing={isRefreshing}
      skeleton={<CategoriesSkeleton />}
      empty={
        <EmptyState
          icon={EMPTY_ICON}
          title="За выбранный период данных нет"
          hint="Попробуйте изменить период или сегмент"
        />
      }
      title="Продажи по категориям"
      size="standard"
      toolbar={
        <TabControl
          options={METRIC_OPTIONS}
          value={activeDatasetIndex === 0 ? "0" : "1"}
          onChange={handleMetricChange}
          ariaLabel="Метрика категорий"
        />
      }
    >
      {data !== null && (
        <div className="flex h-full flex-col">
          <DonutChart
            segments={segments}
            highlightedId={hoverGroup.highlightedId}
            center={centerNode}
            onSegmentEnter={handleSegmentEnter}
            onSegmentLeave={handleSegmentLeave}
          />

          {/* Легенда-таблица со скроллом (ui.md). Шапка — подписи
              колонок; hover строки ↔ сегмент доната. pr-2 — зазор между
              контентом и scrollbar; relative + CardFade — локальный fade
              продолжения списка (общий fade Card на легенду не смотрит).
              mt-6 — зазор между донатом и легендой. */}
          <div className="relative mt-6 min-h-0 flex-1">
            <div ref={legendRef} className="h-full overflow-y-auto pr-2">
              <LegendHeader />

              {/* Ключ — id: в легенде нет анимаций баров, при смене
                  датасета строки честно пересоздаются (README, «UI-правила»). */}
              {activeItems.map((item, index) => (
                <CategoryLegendRow
                  key={item.id}
                  item={item}
                  index={index}
                  highlighted={hoverGroup.highlightedId === item.id}
                  onHighlight={hoverGroup.highlight}
                  onClearHighlight={hoverGroup.clearHighlight}
                />
              ))}
            </div>

            {legendFadeVisible && <CardFade />}
          </div>
        </div>
      )}
    </BlockShell>
  );
}