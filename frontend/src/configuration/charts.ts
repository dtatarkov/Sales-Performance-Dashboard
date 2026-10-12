/**
 * Типоразмеры графиков (ui.md, блоки 3–7): высоты всех обёрток recharts
 * в одном месте — единый реестр, дизайн-изменение высоты не трогает
 * компоненты и виджеты.
 */
export const CHART_HEIGHTS = {
  /** Донат «Продажи по категориям» (блок 7). */
  donut: 200,
  /** Sparkline внутри KPI-карточек и групп потерь. */
  sparkline: 36,
} as const;

/** Тип имени типоразмера — пропс height у чартов. */
export type ChartHeightName = keyof typeof CHART_HEIGHTS;

/**
 * Длительность анимации перестройки чартов и переходов значений, мс:
 * единая константа для CSS-transition баров/подписей (DynamicsChart,
 * ContributionBar, MiniBar), rAF-счётчиков (useAnimatedCounter),
 * прорисовки спарклайна и recharts-анимаций (донат). ui.md,
 * «Анимации»: значения меняются плавно, без «прыжка». Tailwind-класс —
 * duration-400, токен --transition-duration-chart в globals.css; три места
 * держать синхронными (Tailwind v4 не принимает var() в duration-утилитах).
 */
export const CHART_ANIMATION = {
  /** Длительность transition/анимации, мс. */
  durationMs: 400,
  /** Tailwind-класс скорости перехода. */
  durationClass: "duration-400",
  /** Easing-функция transition (CSS и recharts). */
  easing: "ease-out" as const,
} as const;