"use client";

import { useRef, type ReactNode } from "react";

import { Card } from "./Card";
import { useScrollFade } from "../../hooks/ui/useScrollFade";

/** Класс контента при фоновом обновлении (dimming, frontend.md §5). */
const CONTENT_REFRESHING_CLASS =
  "h-full opacity-60 transition-opacity duration-200";

/** Класс контента в обычном состоянии. */
const CONTENT_IDLE_CLASS =
  "h-full opacity-100 transition-opacity duration-200";

/**
 * Тип props BlockShell — каркас блока (frontend-plan.md, этап 6;
 * frontend.md, §5: «Выбор слота тривиален»: data === null → skeleton;
 * data != null && isEmpty → empty; иначе content). Error-сло́та нет — ошибка
 * не меняет то, что рисует карточка (ui.md 3A/3B).
 */
type BlockShellProps<TData> = {
  /** Данные блока (null → skeleton-слот). */
  data: TData | null;
  /** Правило пустоты уже вычислено доменным хуком (false при data === null). */
  isEmpty: boolean;
  /** Фоновое обновление поверх контента (модификатор dimming). */
  isRefreshing: boolean;
  /** Skeleton по форме контента блока. */
  skeleton: ReactNode;
  /** Empty-состояние блока. */
  empty: ReactNode;
  /** Заголовок Card; undefined — карточка без шапки (KPI-блок). */
  title?: string;
  subtitle?: ReactNode;
  /** Типоразмер карточки. */
  size: "compact" | "standard" | "small";
  /** Контролы в шапке карточки (переключатели метрик датасетов). */
  toolbar?: ReactNode;
  /** Контент (data != null && !isEmpty). */
  children: ReactNode;
};

/**
 * BlockShell — каркас блока: выбирает слот skeleton/empty/content и
 * применяет модификатор isRefreshing (dimming контента) (frontend-plan.md,
 * этап 6; frontend.md, §5). Fade внутри карточки вычисляется хуком
 * useScrollFade — единая механика для всех блоков; виджет не знает о скролле.
 *
 * @param props данные/флаги состояния, skeleton, empty, заголовки, контент.
 * @returns карточка в одном из трёх состояний.
 */
export function BlockShell<TData>({
  data,
  isEmpty,
  isRefreshing,
  skeleton,
  empty,
  title,
  subtitle,
  size,
  toolbar,
  children,
}: BlockShellProps<TData>) {
  const contentRef = useRef<HTMLDivElement | null>(null);

  const fadeVisible = useScrollFade(contentRef, data);

  // Слот выбирается тривиально; isRefreshing — модификатор контента, а не
  // отдельный слот (frontend.md, §5).
  let slot = children;

  if (isEmpty) {
    slot = empty;
  }

  if (data === null) {
    slot = skeleton;
  }

  const contentClassName = isRefreshing
    ? CONTENT_REFRESHING_CLASS
    : CONTENT_IDLE_CLASS;

  return (
    <Card
      size={size}
      title={title}
      subtitle={subtitle}
      toolbar={toolbar}
      scrollRef={contentRef}
      fadeAtBottom={data !== null && !isEmpty && fadeVisible}
    >
      {/* Ref один — на скроллящийся div Card (scrollRef): useScrollFade
          меряет скроллер. Вешать тот же ref ещё и на контент нельзя —
          .current зависел бы от порядка аттача ref'ов React. */}
      <div className={contentClassName}>
        {slot}
      </div>
    </Card>
  );
}