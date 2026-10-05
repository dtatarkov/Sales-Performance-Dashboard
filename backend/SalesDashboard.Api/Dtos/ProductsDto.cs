namespace SalesDashboard.Api.Dtos;

/// <summary>Block 8 — top products (api.md, ProductsDto).</summary>
public sealed record ProductsDto(IReadOnlyList<DatasetDto<ProductItemDto>> Datasets);
