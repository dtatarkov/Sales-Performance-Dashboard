namespace SalesDashboard.Api.Dtos;

/// <summary>Block 2 — manager rating datasets (api.md, ManagerRatingDto).</summary>
public sealed record ManagerRatingDto(IReadOnlyList<DatasetDto<ManagerRatingItemDto>> Datasets);
