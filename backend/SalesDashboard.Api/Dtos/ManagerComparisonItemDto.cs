namespace SalesDashboard.Api.Dtos;

/// <summary>One manager row in the comparison (api.md, ManagerComparisonItemDto).</summary>
public sealed record ManagerComparisonItemDto(Guid Id, string Name, decimal Value, DeltaDto? Delta);
