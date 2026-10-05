using SalesDashboard.Api.Dtos;
using SalesDashboard.Application.Models;

namespace SalesDashboard.Api.Mapping;

/// <summary>Блок 2 — рейтинг менеджеров (api.md, ManagerRatingDto).</summary>
public sealed class ManagerRatingDtoMapper : IApiMapper<ManagerRatingModel, ManagerRatingDto>
{
    public ManagerRatingDto Map(ManagerRatingModel source)
        => new(source.Datasets.Select(d => SharedDtoMapper.MapDataset(d, MapItem)).ToList());

    private static ManagerRatingItemDto MapItem(ManagerRatingItemModel item)
        => new(
            item.Id, item.Name, item.Avatar, item.Initials, item.Team, item.SalesCount,
            item.Revenue, SharedDtoMapper.MapDelta(item.RevenueDelta),
            item.GrossProfit, SharedDtoMapper.MapDelta(item.GrossProfitDelta),
            item.AverageCheck, SharedDtoMapper.MapDelta(item.AverageCheckDelta),
            item.Margin, SharedDtoMapper.MapDelta(item.MarginDelta),
            item.CancellationRate, SharedDtoMapper.MapDelta(item.CancellationRateDelta),
            SharedDtoMapper.MapContribution(item.Contribution));
}
