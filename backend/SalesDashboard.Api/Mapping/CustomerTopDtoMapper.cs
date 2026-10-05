using SalesDashboard.Api.Dtos;
using SalesDashboard.Application.Models;

namespace SalesDashboard.Api.Mapping;

/// <summary>Блок 4 — топ-10 клиентов (api.md, CustomerTopDto).</summary>
public sealed class CustomerTopDtoMapper : IApiMapper<CustomerTopModel, CustomerTopDto>
{
    public CustomerTopDto Map(CustomerTopModel source)
        => new(source.Datasets.Select(d => SharedDtoMapper.MapDataset(d, MapItem)).ToList());

    private static CustomerTopItemDto MapItem(CustomerTopItemModel item)
        => new(
            item.Id, item.Name, item.Since, item.OrderCount,
            item.Revenue, SharedDtoMapper.MapDelta(item.RevenueDelta),
            item.GrossProfit, SharedDtoMapper.MapDelta(item.GrossProfitDelta),
            item.AverageCheck, SharedDtoMapper.MapDelta(item.AverageCheckDelta),
            item.Margin, SharedDtoMapper.MapDelta(item.MarginDelta),
            item.RefundRate, SharedDtoMapper.MapDelta(item.RefundRateDelta),
            item.CancellationRate, SharedDtoMapper.MapDelta(item.CancellationRateDelta),
            SharedDtoMapper.MapContribution(item.Contribution));
}
