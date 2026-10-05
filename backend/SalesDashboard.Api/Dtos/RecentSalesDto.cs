namespace SalesDashboard.Api.Dtos;

/// <summary>Block 9 — recent sales (api.md, RecentSalesDto).</summary>
public sealed record RecentSalesDto(IReadOnlyList<SaleFeedItemDto> Sales);
