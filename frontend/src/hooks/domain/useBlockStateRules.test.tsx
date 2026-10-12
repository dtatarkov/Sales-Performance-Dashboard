import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { DashboardQueryProvider } from "../../contexts/dashboardQueryContext";
import {
  createDashboardDtoMock,
  createEmptyDashboardDtoMock,
} from "../../mocks/dashboardMocks";
import { useCancellations } from "./useCancellations";
import { useCategories } from "./useCategories";
import { useCustomerDynamics } from "./useCustomerDynamics";
import { useKpi } from "./useKpi";
import { useManagerComparison } from "./useManagerComparison";
import { useManagerRating } from "./useManagerRating";
import { useRecentSales } from "./useRecentSales";
import { useRefunds } from "./useRefunds";
import { useTimeSeries } from "./useTimeSeries";
import { useTopCustomers } from "./useTopCustomers";
import { useTopProducts } from "./useTopProducts";
import type { DashboardQuery } from "../../interfaces/dashboardQuery";
import type { IsoDate } from "../../types/isoDate";

/** Дефолтный query для тестов: валидные дни, все сегменты. */
const QUERY: DashboardQuery = {
  from: "2026-09-01" as IsoDate,
  to: "2026-09-30" as IsoDate,
  segment: null,
};

/** Срез BlockState, достаточный для проверки правил пустоты. */
type BlockStateLike = {
  data: unknown;
  isEmpty: boolean;
};

/**
 * Рендерит блочный хук с query-провайдером и подменённым fetch, дожидается
 * первого успешного ответа.
 *
 * @param useBlock блочный хук.
 * @param dto ответ API (наполненный или пустого периода).
 * @returns BlockState хука после загрузки данных.
 */
async function renderBlockState(
  useBlock: () => BlockStateLike,
  dto: object,
): Promise<BlockStateLike>
{
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify(dto), { status: 200 })),
  );

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const wrapper = function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <DashboardQueryProvider query={QUERY}>
          {children}
        </DashboardQueryProvider>
      </QueryClientProvider>
    );
  };

  const rendered = renderHook(useBlock, { wrapper });

  await waitFor(() => expect(rendered.result.current.data).not.toBeNull());

  return rendered.result.current;
}

/** Все блочные хуки: правило пустоты каждого прогоняется на обоих ответах. */
const BLOCKS: { name: string; useBlock: () => BlockStateLike }[] = [
  { name: "useKpi (блок 1)", useBlock: useKpi },
  { name: "useManagerRating (блок 2)", useBlock: useManagerRating },
  { name: "useManagerComparison (блок 3)", useBlock: useManagerComparison },
  { name: "useTopCustomers (блок 4)", useBlock: useTopCustomers },
  { name: "useCustomerDynamics (блок 5)", useBlock: useCustomerDynamics },
  { name: "useTimeSeries (блок 6)", useBlock: useTimeSeries },
  { name: "useCategories (блок 7)", useBlock: useCategories },
  { name: "useTopProducts (блок 8)", useBlock: useTopProducts },
  { name: "useRecentSales (блок 9)", useBlock: useRecentSales },
  { name: "useRefunds (блок 10)", useBlock: useRefunds },
  { name: "useCancellations (блок 11)", useBlock: useCancellations },
];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Правила пустоты блоков (useBlockState)", () => {
  it("до первого ответа — skeleton-слот: data=null, isEmpty=false", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Promise<Response>(() => undefined)),
    );

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const wrapper = function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          <DashboardQueryProvider query={QUERY}>
            {children}
          </DashboardQueryProvider>
        </QueryClientProvider>
      );
    };

    const { result } = renderHook(() => useCustomerDynamics(), { wrapper });

    expect(result.current.data).toBeNull();
    expect(result.current.isEmpty).toBe(false);
  });

  it.each(BLOCKS)(
    "$name: наполненный период — контент (isEmpty=false)",
    async ({ useBlock }) => {
      const state = await renderBlockState(useBlock, createDashboardDtoMock());

      expect(state.isEmpty).toBe(false);
    },
  );

  it.each(BLOCKS)(
    "$name: пустой период — empty-слот (isEmpty=true)",
    async ({ useBlock }) => {
      const state = await renderBlockState(
        useBlock,
        createEmptyDashboardDtoMock(),
      );

      expect(state.isEmpty).toBe(true);
    },
  );

  it("блок 5: пустая секция «Падение» не делает блок пустым (ui.md, блок 5)", async () => {
    const dto = createDashboardDtoMock();

    const state = await renderBlockState(useCustomerDynamics, {
      ...dto,
      customerDynamics: {
        growth: dto.customerDynamics.growth,
        decline: [
          { name: "Валовая прибыль", items: [] },
          { name: "Средний чек", items: [] },
        ],
      },
    });

    expect(state.isEmpty).toBe(false);
  });

  it("блок 1: salesCount=null тоже пустой период (данных нет)", async () => {
    const dto = createDashboardDtoMock();

    const state = await renderBlockState(useKpi, {
      ...dto,
      kpi: { ...dto.kpi, salesCount: { value: null, delta: null, series: [] } },
    });

    expect(state.isEmpty).toBe(true);
  });
});
