using SalesDashboard.Api.Dtos;
using SalesDashboard.Application.Models;

namespace SalesDashboard.Api.Mapping;

/// <summary>
/// Общие преобразования read model → DTO, переиспользуемые блочными мапперами
/// (backend.md §6.4). Enum'ы переносятся как есть и сериализуются числами (§6.2).
/// </summary>
internal static class SharedDtoMapper
{
    public static DeltaDto? MapDelta(DeltaModel? delta)
        => delta is null ? null : new DeltaDto(delta.Value, delta.Unit);

    public static SeriesPointDto MapSeriesPoint(SeriesPointModel point)
        => new(point.Value, point.Date);

    public static ContributionDto MapContribution(ContributionModel contribution)
        => new(contribution.ValueAbsolute, contribution.ValueRelative, contribution.ValueRelativeUnit, contribution.ValueNormalized);

    public static DatasetDto<TDto> MapDataset<TModel, TDto>(DatasetModel<TModel> dataset, Func<TModel, TDto> map)
        => new(dataset.Name, dataset.Items.Select(map).ToList());
}
