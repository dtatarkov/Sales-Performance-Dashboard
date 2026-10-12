import type { DashboardDto } from "../types/dto";
import type { DashboardData } from "../types/dashboard";
import { mapCategories } from "./categories";
import { mapCustomerDynamics } from "./customerDynamics";
import { mapCustomerTop } from "./customerTop";
import { mapKpi } from "./kpi";
import { mapLossGroup } from "./lossGroup";
import { mapManagerComparison } from "./managerComparison";
import { mapManagerRating } from "./managerRating";
import { mapProducts } from "./products";
import { mapRecentSales } from "./recentSales";
import { mapTimeSeries } from "./timeSeries";

/**
 * Корневой маппинг ответа POST /api/v1/dashboard в срезы app-типов
 * (frontend.md, раздел 8): композиция блочных мапперов, null-семантика
 * сохраняется как есть.
 *
 * @param dto разобранный JSON ответа (валидация полей — блочные мапперы).
 * @returns DashboardData — срезы всех 11 блоков.
 */
export function mapDashboard(dto: DashboardDto): DashboardData {
  const kpi = mapKpi(dto.kpi);
  const managerRating = mapManagerRating(dto.managerRating);
  const managerComparison = mapManagerComparison(dto.managerComparison);
  const topCustomers = mapCustomerTop(dto.topCustomers);
  const customerDynamics = mapCustomerDynamics(dto.customerDynamics);
  const timeSeries = mapTimeSeries(dto.timeSeries);
  const categories = mapCategories(dto.categories);
  const topProducts = mapProducts(dto.topProducts);
  const recentSales = mapRecentSales(dto.recentSales);
  const refunds = mapLossGroup(dto.refunds, "refunds");
  const cancellations = mapLossGroup(dto.cancellations, "cancellations");

  return {
    kpi,
    managerRating,
    managerComparison,
    topCustomers,
    customerDynamics,
    timeSeries,
    categories,
    topProducts,
    recentSales,
    refunds,
    cancellations,
  };
}
