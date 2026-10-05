namespace SalesDashboard.Api.Dtos;

/// <summary>Block 11 — cancellations (api.md, CancellationsDto).</summary>
public sealed record CancellationsDto(
    decimal Value,
    decimal? Rate,
    DeltaDto? RateDelta,
    IReadOnlyList<SeriesPointDto> Series,
    IReadOnlyList<CancellationTopItemDto> Top,
    CancellationTailDto? Tail);
