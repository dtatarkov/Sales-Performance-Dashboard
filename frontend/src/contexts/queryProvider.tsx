"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * Обёртка QueryClientProvider TanStack (frontend-plan.md, этап 10): page.tsx
 * не знает, чем обслуживаются данные — зависимость от TanStack ограничена
 * слоем hooks/domain и этим файлом.
 *
 * QueryClient создаётся в состоянии useState — один клиент на жизнь страницы
 * (создание в рендере без состояния давало бы новый кэш на каждый рендер).
 *
 * @param props.children дерево приложения.
 * @returns провайдер TanStack Query.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Данные устаревают только со сменой фильтров URL — refetchWindowFocus
            // не нужен: обновление запускает смена периода/сегмента.
            refetchOnWindowFocus: false,
            // Ошибки не ретраятся сами: единственная точка повтора — retry()
            // из widgets/toasts (frontend.md, раздел 5).
            retry: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}