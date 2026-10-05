using SalesDashboard.Api.Dtos;
using SalesDashboard.Application.Models;

namespace SalesDashboard.Api.Mapping;

/// <summary>Блок 8 — топ-10 товаров (api.md, ProductsDto).</summary>
public sealed class ProductsDtoMapper : IApiMapper<ProductsModel, ProductsDto>
{
    public ProductsDto Map(ProductsModel source)
        => new(source.Datasets.Select(d => SharedDtoMapper.MapDataset(d, MapItem)).ToList());

    private static ProductItemDto MapItem(ProductItemModel item)
        => new(
            item.Id, item.Name, item.Sku, item.Category,
            item.Revenue, SharedDtoMapper.MapDelta(item.RevenueDelta),
            item.GrossProfit, SharedDtoMapper.MapDelta(item.GrossProfitDelta),
            item.Units, SharedDtoMapper.MapDelta(item.UnitsDelta),
            item.Margin, SharedDtoMapper.MapDelta(item.MarginDelta),
            item.RefundRate, SharedDtoMapper.MapDelta(item.RefundRateDelta),
            SharedDtoMapper.MapContribution(item.Contribution));
}
