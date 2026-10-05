namespace SalesDashboard.Api.Dtos;

/// <summary>One point of the time series (api.md, TimeSeriesPointDto).</summary>
public sealed record TimeSeriesPointDto(DateTime Date, decimal ValueCurrent, decimal? ValuePrevious);
