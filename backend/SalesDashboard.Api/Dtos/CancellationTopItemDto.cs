namespace SalesDashboard.Api.Dtos;

/// <summary>One manager row in the cancellations top list (api.md, CancellationTopItemDto).</summary>
public sealed record CancellationTopItemDto(
    Guid Id,
    string Name,
    decimal ValueAbsolute,
    decimal ValueRelative,
    decimal ValueNormalized);
