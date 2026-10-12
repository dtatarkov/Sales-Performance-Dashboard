namespace SalesDashboard.Api.Dtos;

/// <summary>Точка динамики во времени: значения на полуинтервале [DateFrom, DateTo) (api.md, TimeSeriesPointDto).</summary>
public sealed record TimeSeriesPointDto(DateTime DateFrom, DateTime DateTo, decimal ValueCurrent, decimal? ValuePrevious);
