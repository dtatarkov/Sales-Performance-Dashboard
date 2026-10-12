using SalesDashboard.Api.Dtos;
using SalesDashboard.Application.Models;

namespace SalesDashboard.Api.Mapping;

/// <summary>
/// Блок 5 — динамика клиентов: маппит две готовые секции «Рост»/«Падение»,
/// каждая — те же два датасета метрик (ui.md §5); строки переносятся как
/// есть — сервер уже ранжировал и нарезал.
/// </summary>
public sealed class CustomerDynamicsDtoMapper : IApiMapper<CustomerDynamicsModel, CustomerDynamicsDto>
{
    public CustomerDynamicsDto Map(CustomerDynamicsModel source)
    {
        var growth = source.Growth.Select(d => SharedDtoMapper.MapDataset(d, MapItem)).ToList();
        var decline = source.Decline.Select(d => SharedDtoMapper.MapDataset(d, MapItem)).ToList();
        var result = new CustomerDynamicsDto(growth, decline);

        return result;
    }

    private static CustomerDynamicsItemDto MapItem(CustomerDynamicsItemModel item)
        => new(item.Id, item.Name, item.Value, item.AbsoluteDelta, SharedDtoMapper.MapDelta(item.Delta));
}
