using SalesDashboard.Application.Abstractions.Queries;
using SalesDashboard.Application.Models;
using SalesDashboard.Domain;

namespace SalesDashboard.Application.Builders;

/// <summary>Блок 6 (api.md): выручка, валовая прибыль и число продаж по бакетам
/// сетки серий периода (<see cref="SeriesBuckets"/>).</summary>
public interface ITimeSeriesBuilder
{
    Task<TimeSeriesModel> BuildAsync(DashboardQuery query, CancellationToken cancellationToken);
}

/// <summary>
/// Три датасета блока — выручка, валовая прибыль, число продаж; каждый — серия
/// за активный период по бакетам сетки серий (SeriesBuckets, api.md блок 6).
/// Текущий бакет сопоставляется с бакетом на том же смещении в предыдущем
/// сопоставимом периоде; бакеты без продаж несут настоящий ноль, поэтому обе
/// линии остаются непрерывными (api.md, блок 6). Предыдущий период всегда равен
/// активному по длительности (PeriodResolver), поэтому у него тот же шаг сетки,
/// то же число бакетов, и previousValue не бывает null.
/// </summary>
public sealed class TimeSeriesBuilder(
    IKpiReadPort kpiPort,
    IPeriodResolver periodResolver) : ITimeSeriesBuilder
{
    public async Task<TimeSeriesModel> BuildAsync(DashboardQuery query, CancellationToken cancellationToken)
    {
        var current = new ReadFilter(query.Period, query.Segment);

        // Серия пунктира берётся из предыдущего сопоставимого периода той же
        // длительности; пара для каждого бакета гарантирована (domain.md).
        var previousPeriod = periodResolver.Previous(query.Period);
        var previous = new ReadFilter(previousPeriod, query.Segment);

        var currentDaily = await kpiPort.ReadDailyAsync(current, cancellationToken);
        var previousDaily = await kpiPort.ReadDailyAsync(previous, cancellationToken);

        var currentBuckets = SeriesBuckets.BucketsOf(query.Period);
        var previousBuckets = SeriesBuckets.BucketsOf(previousPeriod);

        // Шаг сетки задаёт ширину полуинтервала каждой точки; у предыдущего
        // периода он тот же — длительности равны.
        var stepHours = SeriesBuckets.StepHoursOf(query.Period);

        // Индекс «бакет → строки» для быстрого подстановления значений в точки серии.
        var currentByBucket = currentDaily.GroupBy(d => d.Date).ToDictionary(g => g.Key, g => g.ToList());
        var previousByBucket = previousDaily.GroupBy(d => d.Date).ToDictionary(g => g.Key, g => g.ToList());

        // Локальная фабрика: три датасета различаются только селектором метрики,
        // логика сопоставления бакетов общая.
        IReadOnlyList<TimeSeriesPointModel> Series(Func<DailyAggregateRow, decimal> selector)
        {
            var points = new List<TimeSeriesPointModel>(currentBuckets.Count);

            for (var i = 0; i < currentBuckets.Count; i++)
            {
                var bucket = currentBuckets[i];

                // Бакет без продаж отсутствует в индексе → настоящий ноль, линия не рвётся (api.md, блок 6).
                var currentValue = currentByBucket.TryGetValue(bucket, out var currentRows)
                    ? currentRows.Sum(selector)
                    : 0m;

                // Пара по индексу корректна: previousBuckets построен из периода той
                // же длительности, что и currentBuckets.
                var previousBucket = previousBuckets[i];

                var previousValue = previousByBucket.TryGetValue(previousBucket, out var previousRows)
                    ? previousRows.Sum(selector)
                    : 0m;

                points.Add(new TimeSeriesPointModel(
                    bucket,
                    bucket.AddHours(stepHours),
                    currentValue,
                    previousValue));
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
