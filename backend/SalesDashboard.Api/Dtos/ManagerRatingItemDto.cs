namespace SalesDashboard.Api.Dtos;

/// <summary>One manager row in the rating (api.md, ManagerRatingItemDto).</summary>
public sealed record ManagerRatingItemDto(
    Guid Id,
    string Name,
    string? Avatar,
    string Initials,
    string Team,
    int SalesCount,
    decimal Revenue,
    DeltaDto? RevenueDelta,
    decimal Gp,
    DeltaDto? GpDelta,
    decimal Ac,
    DeltaDto? AcDelta,
    decimal? Margin,
    DeltaDto? MarginDelta,
    decimal? CancelRate,
    DeltaDto? CancelRateDelta,
    ContributionDto Contribution);
