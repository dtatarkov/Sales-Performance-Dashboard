using SalesDashboard.Api.Dtos;
using SalesDashboard.Application.Models;

namespace SalesDashboard.Api.Mapping;

/// <summary>Блок 6 — динамика во времени (api.md, TimeSeriesDto).</summary>
public sealed class TimeSeriesDtoMapper : IApiMapper<TimeSeriesModel, TimeSeriesDto>
{
    public TimeSeriesDto Map(TimeSeriesModel source)
        => new(source.Datasets.Select(d => SharedDtoMapper.MapDataset(d, MapPoint)).ToList());

    private static TimeSeriesPointDto MapPoint(TimeSeriesPointModel point)
        => new(point.Date, point.ValueCurrent, point.ValuePrevious);
}
