namespace SalesDashboard.Api.Dtos;

/// <summary>One customer row in the top-10 (api.md, CustomerTopItemDto).</summary>
public sealed record CustomerTopItemDto(
    Guid Id,
    string Name,
    int Since,
    int OrderCount,
    decimal Revenue,
    DeltaDto? RevenueDelta,
    decimal Gp,
    DeltaDto? GpDelta,
    decimal Ac,
    DeltaDto? AcDelta,
    decimal? Margin,
    DeltaDto? MarginDelta,
    decimal? RefundRate,
    DeltaDto? RefundRateDelta,
    decimal? CancelRate,
    DeltaDto? CancelRateDelta,
    ContributionDto Contribution);
