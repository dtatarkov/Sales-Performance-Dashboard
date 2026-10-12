"use client";

import type { ReactNode } from "react";

/**
 * Тип props EmptyState — пустое состояние блока (frontend-plan.md, этап 6;
 * ui.md, «Пустой период без продаж» и «Нет данных по отдельному блоку»):
 * иконка + заголовок + подсказка. Вариант для «Потерь» — свой заголовок/
 * подсказка при тех же элементах.
 */
type EmptyStateProps = {
  /** Иконка (SVG или символ) — у блока своя. */
  icon: ReactNode;
  /** Заголовок: «За выбранный период данных нет» / «Возвратов нет» / «Отмен нет». */
  title: string;
  /** Подсказка: «Попробуйте изменить период или сегмент» / своя у «Потерь». */
  hint: string;
};

/**
 * EmptyState — единая заглушка пустого состояния (frontend-plan.md, этап 6):
 * центрированная колонка иконка/заголовок/подсказка; высота задаётся
 * карточкой (типоразмер), не содержимым.
 *
 * @param props иконка, заголовок, подсказка.
 * @returns пустое состояние.
 */
export function EmptyState({ icon, title, hint }: EmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
      <div aria-hidden className="text-tertiary">
        {icon}
      </div>

      <p className="text-sm font-medium text-text-primary">{title}</p>

      <p className="text-xs text-text-tertiary">{hint}</p>
    </div>
  );
}