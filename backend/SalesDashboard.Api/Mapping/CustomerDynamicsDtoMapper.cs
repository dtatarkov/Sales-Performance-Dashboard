using SalesDashboard.Api.Dtos;
using SalesDashboard.Application.Models;

namespace SalesDashboard.Api.Mapping;

/// <summary>Блок 5 — динамика клиентов (api.md, CustomerDynamicsDto).</summary>
public sealed class CustomerDynamicsDtoMapper : IApiMapper<CustomerDynamicsModel, CustomerDynamicsDto>
{
    public CustomerDynamicsDto Map(CustomerDynamicsModel source)
        => new(source.Datasets.Select(d => SharedDtoMapper.MapDataset(d, MapItem)).ToList());

    private static CustomerDynamicsItemDto MapItem(CustomerDynamicsItemModel item)
        => new(item.Id, item.Name, item.Value, SharedDtoMapper.MapDelta(item.Delta));
}
