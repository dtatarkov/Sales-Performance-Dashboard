namespace SalesDashboard.Api.Dtos;

/// <summary>Block 6 — time series (api.md, TimeSeriesDto).</summary>
public sealed record TimeSeriesDto(IReadOnlyList<DatasetDto<TimeSeriesPointDto>> Datasets);
