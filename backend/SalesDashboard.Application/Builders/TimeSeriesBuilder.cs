using SalesDashboard.Application.Abstractions.Queries;
using SalesDashboard.Application.Models;
using SalesDashboard.Domain;

namespace SalesDashboard.Application.Builders;

/// <summary>Блок 6 (api.md): выручка, валовая прибыль и число продаж по дням.</summary>
public interface ITimeSeriesBuilder
{
    Task<TimeSeriesModel> BuildAsync(DashboardQuery query, CancellationToken cancellationToken);
}

/// <summary>
/// Три датасета блока — выручка, валовая прибыль, число продаж; каждый — дневная
/// серия за активный период. Текущий день сопоставляется с днём на том же смещении
/// в предыдущем сопоставимом периоде; дни без продаж несут настоящий ноль, поэтому
/// обе линии остаются непрерывными (api.md, блок 6).
/// Предыдущий период всегда равен активному по длительности (PeriodResolver),
/// поэтому у каждого дня есть пара, и previousValue не бывает null.
/// </summary>
public sealed class TimeSeriesBuilder(
    IKpiReadPort kpiPort,
    IPeriodResolver periodResolver) : ITimeSeriesBuilder
{
    public async Task<TimeSeriesModel> BuildAsync(DashboardQuery query, CancellationToken cancellationToken)
    {
        var current = new ReadFilter(query.Period, query.Segment);

        // Серия пунктира берётся из предыдущего сопоставимого периода той же
        // длительности; пара для каждого дня гарантирована (domain.md).
        var previousPeriod = periodResolver.Previous(query.Period);
        var previous = new ReadFilter(previousPeriod, query.Segment);

        var currentDaily = await kpiPort.ReadDailyAsync(current, cancellationToken);
        var previousDaily = await kpiPort.ReadDailyAsync(previous, cancellationToken);

        var currentDays = BuilderCommon.DaysOf(query.Period);
        var previousDays = BuilderCommon.DaysOf(previousPeriod);

        // Индекс «день → строки» для быстрого подстановления значений в точки серии.
        var currentByDay = currentDaily.GroupBy(d => d.Date.Date).ToDictionary(g => g.Key, g => g.ToList());
        var previousByDay = previousDaily.GroupBy(d => d.Date.Date).ToDictionary(g => g.Key, g => g.ToList());

        // Локальная фабрика: три датасета различаются только селектором метрики,
        // логика сопоставления дней общая.
        IReadOnlyList<TimeSeriesPointModel> Series(Func<DailyAggregateRow, decimal> selector)
        {
            var points = new List<TimeSeriesPointModel>(currentDays.Count);

            for (var i = 0; i < currentDays.Count; i++)
            {
                var day = currentDays[i];

                // День без продаж отсутствует в индексе → настоящий ноль, линия не рвётся (api.md, блок 6).
                var currentValue = currentByDay.TryGetValue(day, out var currentRows)
                    ? currentRows.Sum(selector)
                    : 0m;

                // Пара по индексу корректна: previousDays построен из периода той
                // же длительности, что и currentDays.
                var previousDay = previousDays[i];

                var previousValue = previousByDay.TryGetValue(previousDay, out var previousRows)
                    ? previousRows.Sum(selector)
                    : 0m;

                points.Add(new TimeSeriesPointModel(day, currentValue, previousValue));
            }

            return points;
        }

        var model = new TimeSeriesModel([
            new DatasetModel<TimeSeriesPointModel>(BuilderCommon.DatasetNames.Revenue, Series(d => d.Revenue)),
            new DatasetModel<TimeSeriesPointModel>(BuilderCommon.DatasetNames.GrossProfit, Series(d => d.Revenue - d.Cost)),
            new DatasetModel<TimeSeriesPointModel>(BuilderCommon.DatasetNames.SalesCount, Series(d => d.PaidCount)),
        ]);

        return model;
    }
}
