namespace SalesDashboard.Api.Dtos;

/// <summary>One product row (api.md, ProductItemDto).</summary>
public sealed record ProductItemDto(
    Guid Id,
    string Name,
    string Sku,
    string Category,
    decimal Revenue,
    DeltaDto? RevenueDelta,
    decimal Gp,
    DeltaDto? GpDelta,
    int Units,
    DeltaDto? UnitsDelta,
    decimal? Margin,
    DeltaDto? MarginDelta,
    decimal? RefundRate,
    DeltaDto? RefundRateDelta,
    ContributionDto Contribution);
