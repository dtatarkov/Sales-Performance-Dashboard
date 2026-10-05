using SalesDashboard.Api.Dtos;
using SalesDashboard.Application.Models;

namespace SalesDashboard.Api.Mapping;

/// <summary>Блок 1 — KPI-карточки и лидер периода (api.md, KpiDto).</summary>
public sealed class KpiDtoMapper : IApiMapper<KpiModel, KpiDto>
{
    public KpiDto Map(KpiModel source)
        => new(
            MapCard(source.Revenue),
            MapCard(source.GrossProfit),
            MapCard(source.Margin),
            MapCard(source.SalesCount),
            MapCard(source.AverageCheck),
            source.BestManager is null ? null : MapBestManager(source.BestManager));

    private static KpiCardDto MapCard(KpiCardModel card)
        => new(card.Value, SharedDtoMapper.MapDelta(card.Delta), card.Series.Select(SharedDtoMapper.MapSeriesPoint).ToList());

    private static BestManagerDto MapBestManager(BestManagerModel source)
        => new(
            source.Id, source.Name, source.Avatar, source.Initials,
            source.GrossProfit, source.SalesCount,
            SharedDtoMapper.MapDelta(source.Delta),
            source.Series.Select(SharedDtoMapper.MapSeriesPoint).ToList());
}
