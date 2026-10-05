using SalesDashboard.Domain;

namespace SalesDashboard.Api.Dtos;

/// <summary>One sale in the recent feed (api.md, SaleFeedItemDto).</summary>
public sealed record SaleFeedItemDto(
    Guid Id,
    string Client,
    string Manager,
    DateTime Date,
    int ItemsCount,
    SaleStatus Status,
    decimal Revenue,
    decimal? Gp);
