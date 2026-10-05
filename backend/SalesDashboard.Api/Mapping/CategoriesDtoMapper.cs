using SalesDashboard.Api.Dtos;
using SalesDashboard.Application.Models;

namespace SalesDashboard.Api.Mapping;

/// <summary>Блок 7 — продажи по категориям (api.md, CategoriesDto).</summary>
public sealed class CategoriesDtoMapper : IApiMapper<CategoriesModel, CategoriesDto>
{
    public CategoriesDto Map(CategoriesModel source)
        => new(source.Datasets.Select(MapDataset).ToList());

    private static CategoryDatasetDto MapDataset(CategoryDatasetModel dataset)
        => new(
            dataset.Name,
            dataset.Items.Select(MapItem).ToList(),
            dataset.Total);

    private static CategoryItemDto MapItem(CategoryItemModel item)
        => new(
            item.Id, item.Name,
            item.Revenue, SharedDtoMapper.MapDelta(item.RevenueDelta),
            item.GrossProfit, SharedDtoMapper.MapDelta(item.GrossProfitDelta),
            item.Margin, SharedDtoMapper.MapDelta(item.MarginDelta),
            item.SalesCount, SharedDtoMapper.MapDelta(item.SalesCountDelta),
            item.Share);
}
