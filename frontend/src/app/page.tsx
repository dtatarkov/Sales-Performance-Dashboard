"use client";

import { Suspense } from "react";

import { useDashboardQuery } from "../hooks/app/useDashboardQuery";
import { DashboardQueryProvider } from "../contexts/dashboardQueryContext";
import { QueryProvider } from "../contexts/queryProvider";

import { DashboardToolbarWidget } from "../widgets/toolbar/DashboardToolbarWidget";
import { ToastsWidget } from "../widgets/toasts/ToastsWidget";
import { AppHeaderWidget } from "../widgets/header/AppHeaderWidget";
import { KpiWidget } from "../widgets/blocks/KpiWidget";
import { ManagerRatingWidget } from "../widgets/blocks/ManagerRatingWidget";
import { ManagerComparisonWidget } from "../widgets/blocks/ManagerComparisonWidget";
import { TopCustomersWidget } from "../widgets/blocks/TopCustomersWidget";
import { CustomerDynamicsWidget } from "../widgets/blocks/CustomerDynamicsWidget";
import { TimeSeriesWidget } from "../widgets/blocks/TimeSeriesWidget";
import { CategoriesWidget } from "../widgets/blocks/CategoriesWidget";
import { TopProductsWidget } from "../widgets/blocks/TopProductsWidget";
import { RecentSalesWidget } from "../widgets/blocks/RecentSalesWidget";
import { RefundsWidget } from "../widgets/blocks/RefundsWidget";
import { CancellationsWidget } from "../widgets/blocks/CancellationsWidget";

/** Максимальная ширина макета (ui.md: целевой viewport 1440×900). */
const PAGE_MAX_WIDTH_CLASS = "max-w-[1440px]";

/** Центрирование контейнера макета. */
const PAGE_CENTERING_CLASS = "mx-auto w-full";

/** Горизонтальный отступ макета (общий для header/тулбара/контента). */
const PAGE_PADDING_X_CLASS = "px-6";

/** Внутренние отступы контейнера контента. */
const PAGE_PADDING_CLASS = `${PAGE_PADDING_X_CLASS} py-4`;

/** Отступ контента от тулбара (шаг после sticky-бара). */
const MAIN_SPACING_CLASS = "pt-4";

/** Вертикальный шаг между рядами блоков. */
const PAGE_GAP_CLASS = "flex flex-col gap-4";

/**
 * Единственная страница приложения — composition root (frontend.md §9):
 * провайдеры (QueryProvider → DashboardQueryProvider) и виджеты; бизнес-
 * логики нет. useSearchParams (внутри useDashboardQuery) требует
 * Suspense-границы при статическом рендере (Next.js), поэтому весь контент,
 * включая вызов URL-хука, живёт под границей в DashboardContent.
 *
 * @returns провайдер запросов с отложенным контентом.
 */
export default function DashboardPage() {
  return (
    <QueryProvider>
      <Suspense fallback={null}>
        <DashboardContent />
      </Suspense>
    </QueryProvider>
  );
}

/**
 * Контент дашборда под Suspense-границей: URL-хук и все виджеты.
 *
 * @returns макет дашборда (максимум 1440px, по центру).
 */
function DashboardContent() {
  const { query, setQuery } = useDashboardQuery();

  const pageClassName = `${PAGE_PADDING_CLASS} ${PAGE_CENTERING_CLASS} ${PAGE_MAX_WIDTH_CLASS}`;

  return (
    <DashboardQueryProvider query={query}>
      <div className={pageClassName}>
        <AppHeaderWidget />

        {/* Тулбар: query/setQuery из URL-хука (frontend.md §6: виджет
            собирает DashboardQuery из событий компонента). */}
        <DashboardToolbarWidget query={query} setQuery={setQuery} />

        <main className={`flex-1 ${MAIN_SPACING_CLASS}`}>
          <div className={PAGE_GAP_CLASS}>
            {/* Row 0: KPI-карточки — 6 карточек в ряд на всю ширину. */}
            <KpiWidget />

            {/* Row 1: Рейтинг менеджеров · Сравнение менеджеров (пара 1:1). */}
            <div className="grid grid-cols-2 gap-4">
              <ManagerRatingWidget />

              <ManagerComparisonWidget />
            </div>

            {/* Row 2: Клиенты — Топ-10 · Динамика клиентов (пара 1:1). */}
            <div className="grid grid-cols-2 gap-4">
              <TopCustomersWidget />

              <CustomerDynamicsWidget />
            </div>

            {/* Row 3: Динамика во времени · Продажи по категориям (пара 1:1). */}
            <div className="grid grid-cols-2 gap-4">
              <TimeSeriesWidget />

              <CategoriesWidget />
            </div>

            {/* Row 4: Лучшие продукты · Последние продажи (пара 1:1). */}
            <div className="grid grid-cols-2 gap-4">
              <TopProductsWidget />

              <RecentSalesWidget />
            </div>

            {/* Row 5: Возвраты · Отмены — уменьшенный типоразмер (ui.md:
                потери не сводятся в общий итог). */}
            <div className="grid grid-cols-2 gap-4">
              <RefundsWidget />

              <CancellationsWidget />
            </div>
          </div>
        </main>
      </div>

      {/* Тосты: подписка на статус дашборда (3A/3B/loading), portal — top-center. */}
      <ToastsWidget />
    </DashboardQueryProvider>
  );
}