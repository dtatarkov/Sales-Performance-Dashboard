namespace SalesDashboard.Api.Dtos;

/// <summary>Leader by gross profit for the period (api.md, BestManagerDto).</summary>
public sealed record BestManagerDto(
    Guid Id,
    string Name,
    string? Avatar,
    string Initials,
    decimal Gp,
    int SalesCount,
    DeltaDto? Delta,
    IReadOnlyList<SeriesPointDto> Series);
