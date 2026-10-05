namespace SalesDashboard.Api.Dtos;

/// <summary>Block 4 — top customers (api.md, CustomerTopDto).</summary>
public sealed record CustomerTopDto(IReadOnlyList<DatasetDto<CustomerTopItemDto>> Datasets);
