using SalesDashboard.Api.Dtos;
using SalesDashboard.Application.Models;

namespace SalesDashboard.Api.Mapping;

/// <summary>Блок 9 — последние продажи (api.md, RecentSalesDto).</summary>
public sealed class RecentSalesDtoMapper : IApiMapper<RecentSalesModel, RecentSalesDto>
{
    public RecentSalesDto Map(RecentSalesModel source)
        => new(source.Sales.Select(MapItem).ToList());

    private static SaleFeedItemDto MapItem(SaleFeedItemModel item)
        => new(item.Id, item.Client, item.Manager, item.Date, item.ItemsCount, item.Status, item.Revenue, item.GrossProfit);
}
