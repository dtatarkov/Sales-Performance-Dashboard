"use client";

import type { ReactNode } from "react";

/**
 * Тип props Toolbar — layout-обвязка тулбара (ui.md, «Тулбар»): sticky,
 * нижняя граница, ограничение ширины, распределение контролов по краям.
 */
type ToolbarProps = {
  /** Контролы тулбара (слева период, справа сегмент). */
  children: ReactNode;
};

/**
 * Toolbar — layout-обвязка тулбара (ui.md, «Тулбар»): sticky-контейнер с
 * нижней границей; содержимое распределено по краям. Состав контролов
 * определяет виджет.
 *
 * @param props контролы тулбара.
 * @returns тулбар-обвязку.
 */
export function Toolbar({ children }: ToolbarProps) {
  return (
    <div className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="flex items-center justify-between gap-4 py-3">
        {children}
      </div>
    </div>
  );
}
