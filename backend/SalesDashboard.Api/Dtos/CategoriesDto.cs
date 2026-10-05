namespace SalesDashboard.Api.Dtos;

/// <summary>Block 7 — categories (api.md, CategoriesDto).</summary>
public sealed record CategoriesDto(IReadOnlyList<CategoryDatasetDto> Datasets);
