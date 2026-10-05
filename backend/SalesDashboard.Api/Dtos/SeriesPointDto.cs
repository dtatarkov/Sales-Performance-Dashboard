namespace SalesDashboard.Api.Dtos;

/// <summary>One point of a daily series (api.md, SeriesPointDto).</summary>
public sealed record SeriesPointDto(decimal Value, DateTime Date);
