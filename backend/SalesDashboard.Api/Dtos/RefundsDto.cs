namespace SalesDashboard.Api.Dtos;

/// <summary>Block 10 — refunds (api.md, RefundsDto).</summary>
public sealed record RefundsDto(
    decimal Value,
    decimal? Rate,
    DeltaDto? RateDelta,
    IReadOnlyList<SeriesPointDto> Series,
    IReadOnlyList<RefundTopItemDto> Top,
    RefundTailDto? Tail);
