"use client";

import { EmptyState } from "../../components/ui/EmptyState";

/** Пустая иконка заглушки группы потерь. */
const LOSS_EMPTY_ICON = (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 3a9 9 0 100 18 9 9 0 000-18z" />

    <path d="M9 12h6" />
  </svg>
);

/**
 * Empty-слот группы потерь (ui.md, «Пустой период без продаж»: блоки «Потери»
 * не перекрываются общим «нет данных» — свои заглушки «Возвратов нет» /
 * «Отмен нет» с подписью про отсутствие зафиксированных событий).
 *
 * @param props заголовок («Возвратов нет»/«Отмен нет») и подпись.
 * @returns пустое состояние группы.
 */
export function LossGroupEmpty({
  title,
  hint,
}: {
  title: string;
  hint: string;
}) {
  return <EmptyState icon={LOSS_EMPTY_ICON} title={title} hint={hint} />;
}
