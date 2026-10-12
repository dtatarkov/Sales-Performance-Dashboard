"use client";

import { type ReactNode, type RefObject } from "react";

import { CardFade } from "./CardFade";

/** Типоразмер карточки (ui.md, «Три типоразмера карточек»). */
export type CardSize = "compact" | "standard" | "small";

/**
 * Тип props Card — карточка блока (frontend-plan.md, этап 6): заголовок +
 * опциональный субзаголовок (правая часть шапки) + контент со скроллом.
 */
type CardProps = {
  /** Типоразмер: задаёт высоту карточки (ui.md: высота — от типоразмера). */
  size: CardSize;
  /** Заголовок карточки; без заголовка шапка не рендерится (KPI-блок). */
  title?: string;
  /** Дополнительная строка шапки (справа; например, диапазон периодов). */
  subtitle?: ReactNode;
  /** Контролы шапки (переключатели метрик; справа, на уровне заголовка). */
  toolbar?: ReactNode;
  /** Ref на скроллящийся div контента; undefined — ref не нужен. */
  scrollRef?: RefObject<HTMLDivElement | null>;
  /** Контент карточки (или skeleton/empty — решает BlockShell). */
  children: ReactNode;
};

/** Высота типоразмера (токены globals.css). */
const SIZE_HEIGHT: Record<CardSize, string> = {
  compact: "var(--kpi-height)",
  standard: "var(--card-height)",
  small: "var(--card-sm-height)",
};

/**
 * Card — примитив карточки блока (frontend-plan.md, этап 6; ui.md,
 * «Скролл внутри карточки»): фиксированная высота по типоразмеру, шапка,
 * контент со внутренним скроллом и fade внизу — маркером продолжения списка.
 *
 * Fade управляется родителем (BlockShell/виджет) через props.fadeAtBottom —
 * вычисление видимости fade живёт в BlockShell (единая механика для всех
 * блоков); Card только рисует overlay-градиент, не резервируя место в потоке.
 *
 * @param props типоразмер, заголовок, субзаголовок, контент, fade.
 * @returns карточка.
 */
export function Card({
  size,
  title,
  subtitle,
  toolbar,
  scrollRef,
  children,
  fadeAtBottom = false,
}: CardProps & { fadeAtBottom?: boolean }) {
  const cardClassName =
    "flex flex-col rounded-xl border border-border bg-surface";

  const cardStyle = {
    height: SIZE_HEIGHT[size],
  } as const;

  // Условные узлы вычисляются в теле; null не рендерится (AGENTS.md, «Стиль JSX»).
  // Шапка — .card-head макета: заголовок слева, табы/субзаголовок справа
  // на одной строке (ui.md, блоки 2–10).
  const subtitleNode = subtitle !== undefined
    ? <div className="text-xs text-text-tertiary">{subtitle}</div>
    : null;

  const headerNode = title !== undefined || subtitle !== undefined || toolbar !== undefined
    ? (
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
        {title !== undefined && (
          <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
        )}

        <div className="flex items-center gap-2">
          {subtitleNode}

          {toolbar}
        </div>
      </header>
    )
    : null;

  const fadeNode = fadeAtBottom ? <CardFade /> : null;

  return (
    <section className={cardClassName} style={cardStyle}>
      {headerNode}

      <div className="relative min-h-0 flex-1">
        {/* Скроллящийся контент: колесо внутри карточки не прокручивает
            страницу (ui.md). min-h-0 обязателен — иначе flex не даёт
            контенту сжаться ниже своего размера. pr-2 — зазор между
            контентом и scrollbar, чтобы текст не прилипал к полосе. */}
        <div ref={scrollRef} className="h-full overflow-y-auto px-4 pr-2 py-3">{children}</div>

        {fadeNode}
      </div>
    </section>
  );
}