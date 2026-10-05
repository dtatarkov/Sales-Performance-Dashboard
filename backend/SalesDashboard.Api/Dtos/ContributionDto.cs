using SalesDashboard.Domain;

namespace SalesDashboard.Api.Dtos;

/// <summary>An element's contribution in three forms (api.md, ContributionDto).</summary>
public sealed record ContributionDto(
    decimal ValueAbsolute,
    decimal? ValueRelative,
    ContributionBasis ValueRelativeUnit,
    decimal ValueNormalized);
