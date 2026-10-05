namespace SalesDashboard.Api.Dtos;

/// <summary>The "Остальные N" tail of the refunds list (api.md, RefundTailDto).</summary>
public sealed record RefundTailDto(int Count, decimal ValueAbsolute, decimal ValueRelative);
