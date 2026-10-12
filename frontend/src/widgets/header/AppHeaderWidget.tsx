"use client";

import { APP_NAME } from "../../configuration/app";

/**
 * Виджет header'а страницы (ui.md, «Header»): только заголовок приложения,
 * без подзаголовка, контролов, фона и нижней границы. Между header и
 * тулбаром — отступ. Инфраструктурный виджет страницы — как тулбар и тосты:
 * страницу рисуют только виджеты (AGENTS.md, «Организация кода»).
 *
 * @returns заголовок приложения.
 */
export function AppHeaderWidget() {
  return (
    <header className="pt-6 pb-2">
      <h1 className="text-lg font-semibold text-text-primary">{APP_NAME}</h1>
    </header>
  );
}
