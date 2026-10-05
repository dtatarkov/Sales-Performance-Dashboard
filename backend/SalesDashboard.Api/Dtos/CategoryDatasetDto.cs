namespace SalesDashboard.Api.Dtos;

/// <summary>Dataset plus the total its donut is drawn from (api.md, CategoryDatasetDto).</summary>
public sealed record CategoryDatasetDto(string Name, IReadOnlyList<CategoryItemDto> Items, decimal Total);
