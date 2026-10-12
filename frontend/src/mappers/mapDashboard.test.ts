import { describe, expect, it } from "vitest";

import { createDashboardDtoMock } from "../mocks/dashboardMocks";
import { mapDashboard } from "./mapDashboard";

describe("mapDashboard (композиция блоков)", () =>
{
  it("маппит все 11 блоков — сущности на месте", () =>
  {
    const dto = createDashboardDtoMock();
    const result = mapDashboard(dto);

    expect(result.kpi).not.toBeNull();
    expect(result.managerRating).not.toBeNull();
    expect(result.managerComparison).not.toBeNull();
    expect(result.topCustomers).not.toBeNull();
    expect(result.customerDynamics).not.toBeNull();
    expect(result.timeSeries).not.toBeNull();
    expect(result.categories).not.toBeNull();
    expect(result.topProducts).not.toBeNull();
    expect(result.recentSales).not.toBeNull();
    expect(result.refunds).not.toBeNull();
    expect(result.cancellations).not.toBeNull();
  });
});
