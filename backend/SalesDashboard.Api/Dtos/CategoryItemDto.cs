namespace SalesDashboard.Api.Dtos;

/// <summary>One product category row (api.md, CategoryItemDto).</summary>
public sealed record CategoryItemDto(
    Guid Id,
    string Name,
    decimal Revenue,
    DeltaDto? RevenueDelta,
    decimal Gp,
    DeltaDto? GpDelta,
    decimal? Margin,
    DeltaDto? MarginDelta,
    int SalesCount,
    DeltaDto? SalesCountDelta,
    decimal Share);
