import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { DashboardQueryProvider } from "../../contexts/dashboardQueryContext";
import { createDashboardDtoMock } from "../../mocks/dashboardMocks";
import { useDashboard } from "./useDashboard";
import type { DashboardQuery } from "../../interfaces/dashboardQuery";
import type { IsoDate } from "../../types/isoDate";

/** Дефолтный query для тестов: валидные дни, все сегменты. */
const QUERY: DashboardQuery = {
  from: "2026-09-01" as IsoDate,
  to: "2026-09-30" as IsoDate,
  segment: null,
};

/** Тип подмены fetch: постоянный ответ или функция по номеру вызова. */
type FetchStub = Response | Promise<Response> | ((requestCount: number) => Response | Promise<Response>);

/**
 * Рендерит useDashboard с query-провайдером и подменённым fetch: каждый
 * вызов fetch получает свежий Response (повторное чтение body запрещено).
 *
 * @param stub постоянный ответ/промис или фабрика по номеру вызова.
 * @returns result хука.
 */
function renderWithDashboard(stub: FetchStub)
{
  let requestCount = 0;

  const fetchMock = vi.fn(async () => {
    requestCount += 1;

    const result = typeof stub === "function" ? stub(requestCount) : stub;

    return result;
  });

  vi.stubGlobal("fetch", fetchMock);

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

  const rendered = renderHook(() => useDashboard(), { wrapper });

  return rendered;
}

describe("useDashboard (DashboardStatus)", () => {
  it("initial loading: isLoading=true, hasData=false", async () => {
    const { result } = await renderWithDashboard(
      new Promise<Response>(() => undefined), // никогда не резолвится
    );

    expect(result.current.status.isLoading).toBe(true);
    expect(result.current.status.hasData).toBe(false);
    expect(result.current.data).toBeNull();
  });

  it("успех: hasData=true, hasError=false, данные мапплены", async () => {
    const response = new Response(
      JSON.stringify(createDashboardDtoMock()),
      { status: 200 },
    );

    const { result } = await renderWithDashboard(response);

    await waitFor(() => expect(result.current.status.hasData).toBe(true));

    expect(result.current.status.hasError).toBe(false);
    expect(result.current.data?.kpi.revenue.value).toBe(1000);
  });

  it("ошибка при первом запросе (3A): hasError=true, hasData=false", async () => {
    const response = new Response("nope", { status: 500 });

    const { result } = await renderWithDashboard(response);

    await waitFor(() => expect(result.current.status.hasError).toBe(true));

    expect(result.current.status.hasData).toBe(false);
    expect(result.current.data).toBeNull();
  });

  it("ошибка при обновлении (3B): hasError=true, hasData=true, данные удержаны", async () => {
    const { result } = renderWithDashboard((requestCount) => {
      if (requestCount === 1) {
        const success = new Response(
          JSON.stringify(createDashboardDtoMock()),
          { status: 200 },
        );

        return success;
      }

      const failure = new Response("nope", { status: 500 });

      return failure;
    });

    await waitFor(() => expect(result.current.status.hasData).toBe(true));

    act(() => result.current.status.retry());

    await waitFor(() => expect(result.current.status.hasError).toBe(true));

    // 3B: старые данные удержаны (placeholderData), hasError сигналит toast.
    expect(result.current.status.hasData).toBe(true);
    expect(result.current.data?.kpi.revenue.value).toBe(1000);
  });
});