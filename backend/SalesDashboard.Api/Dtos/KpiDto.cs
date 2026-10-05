namespace SalesDashboard.Api.Dtos;

/// <summary>Block 1 — KPI cards (api.md, KpiDto).</summary>
public sealed record KpiDto(
    KpiCardDto Revenue,
    KpiCardDto Gp,
    KpiCardDto Margin,
    KpiCardDto SalesCount,
    KpiCardDto AvgCheck,
    BestManagerDto? BestManager);
