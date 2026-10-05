namespace SalesDashboard.Api.Dtos;

/// <summary>Block 3 — manager comparison datasets (api.md, ManagerComparisonDto).</summary>
public sealed record ManagerComparisonDto(IReadOnlyList<DatasetDto<ManagerComparisonItemDto>> Datasets);
