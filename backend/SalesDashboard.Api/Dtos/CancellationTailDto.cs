namespace SalesDashboard.Api.Dtos;

/// <summary>The "Остальные N" tail of the cancellations list (api.md, CancellationTailDto).</summary>
public sealed record CancellationTailDto(int Count, decimal ValueAbsolute, decimal ValueRelative);
