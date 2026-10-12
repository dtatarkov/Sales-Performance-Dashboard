"use client";

import { useBlockState } from "./useBlockState";
import type { BlockState } from "../../interfaces/blockState";
import type {
  DashboardData,
  TimeSeriesData,
  TimeSeriesPoint,
} from "../../types/dashboard";

/** Ширина часового бакета в миллисекундах — минимальный шаг сетки серий. */
const HOUR_MS = 3_600_000;

/**
 * Факт о данных ряда: однодневный ли период (модульный уровень). Шаг сетки
 * серий равен 1 ч только для периода из одних суток (api.md, «Сетка бакетов
 * серий») — в этом режиме ось блока 6 подписывается часами. Правило сетки
 * живёт здесь, а не в виджете: это свойство данных, а не раскладки.
 *
 * @param points точки активного датасета.
 * @returns true — период из одних суток.
 */
export function isOneDaySeries(points: TimeSeriesPoint[]): boolean
{
  if (points.length === 0)
  {
    return false;
  }

  const firstPointWidth = points[0].dateTo.getTime() - points[0].dateFrom.getTime();

  return firstPointWidth === HOUR_MS;
}

/**
 * Правило пустоты блока 6 «Динамика во времени» (ui.md, блок 6): точек нет —
 * показывается заглушка «нет данных».
 *
 * @param data срез временных рядов.
 * @returns true, когда нет точек ни в одном датасете.
 */
function isEmptyTimeSeries(data: TimeSeriesData): boolean
{
  return data.datasets.every((dataset) => dataset.items.length === 0);
}

/**
 * Селектор среза блока 6: timeSeries (модульный уровень).
 *
 * @param data общие данные дашборда.
 * @returns срез временных рядов.
 */
function selectTimeSeries(data: DashboardData): TimeSeriesData
{
  return data.timeSeries;
}

/**
 * Доменный хук блока 6 «Динамика во времени».
 *
 * @returns BlockState<TimeSeriesData>.
 */
export function useTimeSeries(): BlockState<TimeSeriesData>
{
  return useBlockState(selectTimeSeries, isEmptyTimeSeries);
}