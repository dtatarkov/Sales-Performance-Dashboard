using SalesDashboard.Api.Dtos;
using SalesDashboard.Application.Models;

namespace SalesDashboard.Api.Mapping;

/// <summary>
/// Блоки 10–11 — возвраты и отмены (api.md, RefundsDto / CancellationsDto).
/// Оба блока структурно идентичны и отличаются лишь разрезом топа, поэтому
/// живут в одном маппере.
/// </summary>
public sealed class LossDtoMapper :
    IApiMapper<RefundsModel, RefundsDto>,
    IApiMapper<CancellationsModel, CancellationsDto>
{
    public RefundsDto Map(RefundsModel source)
        => new(
            source.Value,
            source.Rate,
            SharedDtoMapper.MapDelta(source.RateDelta),
            source.Series.Select(SharedDtoMapper.MapSeriesPoint).ToList(),
            source.Top.Select(MapRefundItem).ToList(),
            source.Tail is null ? null : new RefundTailDto(
                source.Tail.Count, source.Tail.ValueAbsolute, source.Tail.ValueRelative));

    public CancellationsDto Map(CancellationsModel source)
        => new(
            source.Value,
            source.Rate,
            SharedDtoMapper.MapDelta(source.RateDelta),
            source.Series.Select(SharedDtoMapper.MapSeriesPoint).ToList(),
            source.Top.Select(MapCancellationItem).ToList(),
            source.Tail is null ? null : new CancellationTailDto(
                source.Tail.Count, source.Tail.ValueAbsolute, source.Tail.ValueRelative));

    private static RefundTopItemDto MapRefundItem(LossItemModel item)
        => new(item.Id, item.Name, item.Category ?? string.Empty, item.ValueAbsolute, item.ValueRelative, item.ValueNormalized);

    private static CancellationTopItemDto MapCancellationItem(LossItemModel item)
        => new(item.Id, item.Name, item.ValueAbsolute, item.ValueRelative, item.ValueNormalized);
}
