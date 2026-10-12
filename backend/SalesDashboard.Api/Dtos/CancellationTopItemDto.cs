namespace SalesDashboard.Api.Dtos;

/// <summary>Строка менеджера в топе отмен (api.md, CancellationTopItemDto).</summary>
public sealed record CancellationTopItemDto(
    Guid Id,
    string Name,
    string Team,
    decimal ValueAbsolute,
    decimal ValueRelative,
    decimal ValueNormalized);
