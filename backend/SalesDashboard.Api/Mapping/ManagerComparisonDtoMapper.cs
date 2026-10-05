using SalesDashboard.Api.Dtos;
using SalesDashboard.Application.Models;

namespace SalesDashboard.Api.Mapping;

/// <summary>Блок 3 — сравнение менеджеров (api.md, ManagerComparisonDto).</summary>
public sealed class ManagerComparisonDtoMapper : IApiMapper<ManagerComparisonModel, ManagerComparisonDto>
{
    public ManagerComparisonDto Map(ManagerComparisonModel source)
        => new(source.Datasets.Select(d => SharedDtoMapper.MapDataset(d, MapItem)).ToList());

    private static ManagerComparisonItemDto MapItem(ManagerComparisonItemModel item)
        => new(item.Id, item.Name, item.Value, SharedDtoMapper.MapDelta(item.Delta));
}
