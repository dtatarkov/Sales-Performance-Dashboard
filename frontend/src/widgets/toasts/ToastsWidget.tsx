"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import { useDashboard } from "../../hooks/domain/useDashboard";
import { Toaster } from "../../components/ui/Toaster";
import type { DashboardStatus } from "../../interfaces/dashboardStatus";

/** Единый id тоста статуса дашборда — дедупликация повторов (этап 8). */
const DASHBOARD_TOAST_ID = "dashboard-status";

/**
 * Конвертирует статус запроса в тост (frontend-plan.md, этап 8 — чистая
 * функция описана в плане; здесь — эффект подписки):
 *
 * - isRefreshing → toast.loading('Обновление данных…', { id });
 * - hasError && hasData → 3B: «Не удалось обновить данные. Показаны данные
 *   за предыдущий период» + «Обновить»;
 * - hasError && !hasData → 3A: «Не удалось загрузить данные» + «Обновить»;
 * - иначе — dismiss(id).
 *
 * Все вызовы toast.* — только здесь (правило «императивная граница — в одном
 * месте»); рендер — <Toaster> из примитивов.
 *
 * @param status статус дашборда.
 */
export function syncDashboardStatusToast(status: DashboardStatus): void {
  if (status.isRefreshing) {
    toast.loading("Обновление данных…", { id: DASHBOARD_TOAST_ID });

    return;
  }

  if (status.hasError && status.hasData) {
    toast.error("Не удалось обновить данные. Показаны данные за предыдущий период", {
      id: DASHBOARD_TOAST_ID,
      duration: Infinity,
      action: {
        label: "Обновить",
        onClick: () => {
          status.retry();
        },
      },
    });

    return;
  }

  if (status.hasError && !status.hasData) {
    toast.error("Не удалось загрузить данные", {
      id: DASHBOARD_TOAST_ID,
      duration: Infinity,
      action: {
        label: "Обновить",
        onClick: () => {
          status.retry();
        },
      },
    });

    return;
  }

  // Разрешение состояния (данные пришли, ошибки нет) — тост скрывается.
  toast.dismiss(DASHBOARD_TOAST_ID);
}

/**
 * Виджет тостов (frontend.md, §6 «Инфраструктурные виджеты»): подписан на
 * useDashboard().status, конвертирует статус в тосты, рендерит точку Toaster.
 * Дедупликация — единый id; loading→error не плодит новые тосты.
 *
 * @returns Toaster (сам тост рисует sonner в портале).
 */
export function ToastsWidget() {
  const { status } = useDashboard();

  useEffect(() => {
    syncDashboardStatusToast(status);
  }, [status]);

  return <Toaster />;
}