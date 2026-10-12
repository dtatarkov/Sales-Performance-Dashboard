// SWR-сценарий кэша (frontend-plan.md, этап 4; frontend.md, раздел 5):
// смена фильтров удерживает предыдущие данные (placeholderData), блоки
// получают isRefreshing вместо skeleton'а.

import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { DashboardQueryProvider } from "../../contexts/dashboardQueryContext";
import { useDashboard } from "./useDashboard";
import { createDashboardDtoMock } from "../../mocks/dashboardMocks";
import type { DashboardQuery } from "../../interfaces/dashboardQuery";
import type { IsoDate } from "../../types/isoDate";

/** Первый период теста. */
const QUERY_A: DashboardQuery = {
  from: "2026-09-01" as IsoDate,
  to: "2026-09-30" as IsoDate,
  segment: null,
};

/** Второй период (смена фильтра). */
const QUERY_B: DashboardQuery = {
  from: "2026-08-01" as IsoDate,
  to: "2026-08-31" as IsoDate,
  segment: "smb",
};

/**
 * Обёртка с управляемым извне query: тест меняет query через rerender.
 *
 * @param query текущие фильтры.
 * @returns пара wrapper + смена query.
 */
function makeRerenderableWrapper(query: DashboardQuery) {
  let currentQuery = query;

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const Wrapper = function ({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <DashboardQueryProvider query={currentQuery}>
          {children}
        </DashboardQueryProvider>
      </QueryClientProvider>
    );
  };

  return {
    wrapper: Wrapper,
    setQuery: (next: DashboardQuery) => {
      currentQuery = next;
    },
  };
}

describe("useDashboard (SWR-сценарий)", () => {
  it("смена фильтра: данные удерживаются, isRefreshing=true до ответа", async () => {
    const { wrapper, setQuery } = makeRerenderableWrapper(QUERY_A);

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify(createDashboardDtoMock()), { status: 200 }),
      ),
    );

    const { result, rerender } = renderHook(() => useDashboard(), { wrapper });

    // Дождаться первого ответа по QUERY_A.
    await waitFor(() => expect(result.current.status.hasData).toBe(true));

    const firstData = result.current.data;

    expect(firstData).not.toBeNull();

    // Замедлить второй ответ, чтобы поймать состояние удержания.
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            setTimeout(
              () =>
                resolve(
                  new Response(JSON.stringify(createDashboardDtoMock()), {
                    status: 200,
                  }),
                ),
              150,
            );
          }),
      ),
    );

    // Сменить фильтры — queryKey меняется, запрос перезапускается.
    setQuery(QUERY_B);
    rerender();

    // Удержание: данные не исчезли, фоновое обновление активно.
    await waitFor(() =>
      expect(result.current.status.isRefreshing).toBe(true),
    );

    expect(result.current.status.hasData).toBe(true);
    expect(result.current.data).not.toBeNull();

    // Ответ пришёл — обновление завершилось.
    await waitFor(() =>
      expect(result.current.status.isRefreshing).toBe(false),
    );

    expect(result.current.status.hasData).toBe(true);
  });

  it("возврат к ранее выбранному периоду — из кэша мгновенно и параллельно обновление из API", async () => {
    const { wrapper, setQuery } = makeRerenderableWrapper(QUERY_A);

    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify(createDashboardDtoMock()), { status: 200 }),
    );

    vi.stubGlobal("fetch", fetchMock);

    const { result, rerender } = renderHook(() => useDashboard(), { wrapper });

    await waitFor(() => expect(result.current.status.hasData).toBe(true));

    // Уйти на другой период.
    setQuery(QUERY_B);
    rerender();

    await waitFor(() => expect(result.current.status.isRefreshing).toBe(false));

    const callsAfterFirstSwitch = fetchMock.mock.calls.length;

    // Вернуться к QUERY_A: данные показываются из кэша сразу (staleTime: 0
    // делает кэш устаревшим — параллельно стартует фоновое обновление).
    setQuery(QUERY_A);
    rerender();

    // Кэш-состояние мгновенно: hasData без ожидания сети.
    expect(result.current.status.hasData).toBe(true);

    // Фоновая ревалидация запустилась — fetch вызван ещё раз.
    await waitFor(() =>
      expect(fetchMock.mock.calls.length).toBe(callsAfterFirstSwitch + 1),
    );

    // Обновление завершилось — изRefreshing погас.
    await waitFor(() =>
      expect(result.current.status.isRefreshing).toBe(false),
    );

    expect(result.current.status.hasData).toBe(true);
  });
});