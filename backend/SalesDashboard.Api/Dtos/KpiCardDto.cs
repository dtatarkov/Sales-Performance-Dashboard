namespace SalesDashboard.Api.Dtos;

/// <summary>KPI card: value, delta and daily series (api.md, KpiCardDto).</summary>
public sealed record KpiCardDto(decimal? Value, DeltaDto? Delta, IReadOnlyList<SeriesPointDto> Series);
