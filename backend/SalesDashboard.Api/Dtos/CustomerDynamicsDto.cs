namespace SalesDashboard.Api.Dtos;

/// <summary>Block 5 — customer dynamics (api.md, CustomerDynamicsDto).</summary>
public sealed record CustomerDynamicsDto(IReadOnlyList<DatasetDto<CustomerDynamicsItemDto>> Datasets);
