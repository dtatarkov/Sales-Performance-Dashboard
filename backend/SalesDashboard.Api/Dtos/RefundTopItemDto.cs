namespace SalesDashboard.Api.Dtos;

/// <summary>One refund row in the top list (api.md, RefundTopItemDto).</summary>
public sealed record RefundTopItemDto(
    Guid Id,
    string Name,
    string Category,
    decimal ValueAbsolute,
    decimal ValueRelative,
    decimal ValueNormalized);
