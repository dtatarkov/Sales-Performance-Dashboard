namespace SalesDashboard.Api.Dtos;

/// <summary>Точка серии по сетке бакетов: значение на полуинтервале [DateFrom, DateTo) (api.md, SeriesPointDto).</summary>
public sealed record SeriesPointDto(decimal Value, DateTime DateFrom, DateTime DateTo);
