using SalesDashboard.Application.Abstractions.Queries;
using SalesDashboard.Application.Models;
using SalesDashboard.Domain;

namespace SalesDashboard.Application.Builders;

/// <summary>
/// Блоки менеджеров (api.md, блоки 2 и 3) — рейтинг и сравнение,
/// построенные из одного чтения реестра + агрегатов, чтобы избежать двойного ввода-вывода.
/// </summary>
public interface IManagerBuilder
{
    Task<(ManagerRatingModel Rating, ManagerComparisonModel Comparison)> BuildAsync(
        DashboardQuery query,
        CancellationToken cancellationToken);
}

public sealed class ManagerBuilder(
    IManagerReadPort managerPort,
    IPeriodResolver periodResolver,
    IResultMetricsCalculator metrics,
    IContributionCalculator contributions,
    IDeltaCalculator deltas,
    IDatasetRankingPolicy ranking,
    ILossRateCalculator lossRates,
    MetricThresholds thresholds) : IManagerBuilder
{
    /// <summary>
    /// Читает реестр и агрегаты обоих периодов, строит рейтинг (все менеджеры,
    /// включая бездействующих с нулями) и сравнение (TopN) из одних строк
    /// (backend.md §4.3 — одно чтение на оба блока).
    /// </summary>
    public async Task<(ManagerRatingModel Rating, ManagerComparisonModel Comparison)> BuildAsync(
        DashboardQuery query,
        CancellationToken cancellationToken)
    {
        // Фильтры текущего и предыдущего периодов (дата-диапазон + сегмент).
        var current = new ReadFilter(query.Period, query.Segment);
        var previous = new ReadFilter(periodResolver.Previous(query.Period), query.Segment);

        // Одно чтение реестра и агрегатов на оба блока (backend.md §4.3).
        var roster = await managerPort.ReadRosterAsync(cancellationToken);
        var currentAggregates = await managerPort.ReadAggregatesAsync(current, cancellationToken);
        var previousAggregates = await managerPort.ReadAggregatesAsync(previous, cancellationToken);

        // Индексы агрегатов по Id менеджера для быстрого поиска пары.
        var aggregates = Index(currentAggregates);
        var previousById = Index(previousAggregates);

        // Строки строятся по реестру, а не по агрегатам: менеджер без сделок
        // в периоде должен остаться в рейтинге с нулями, а не исчезнуть.
        var rows = roster
            .Select(person => BuildRow(
                person,
                aggregates.TryGetValue(person.Id, out var currentRow) ? currentRow : null,
                previousById.TryGetValue(person.Id, out var previousRow) ? previousRow : null))
            .ToList();

        // Агрегаты группы: суммы, средний чек и максимумы для нормировки вкладов.
        var totalGrossProfit = rows.Sum(r => r.GrossProfit);
        var totalPaidCount = rows.Sum(r => r.SalesCount);
        var groupAverageCheck = totalPaidCount > 0 ? rows.Sum(r => r.Revenue) / totalPaidCount : 0m;
        var maxGrossProfit = rows.Count == 0 ? 0m : rows.Max(r => r.GrossProfit);
        var maxAverageCheck = rows.Count == 0 ? 0m : rows.Max(r => r.AverageCheck);

        // Рейтинг не обрезается TopN (показывает всех), сравнение — обрезается.
        var byGrossProfit = ranking.OrderByMetricDescending(
            rows, r => r.GrossProfit, revenueTieBreak: r => r.Revenue, name: r => r.Person.Name);

        var byAverageCheck = ranking.OrderByMetricDescending(
            rows, r => r.AverageCheck, revenueTieBreak: r => r.Revenue, name: r => r.Person.Name);

        // Блок 2: рейтинг — все менеджеры с полным набором метрик и вкладом.
        var ratingGrossProfitItems = byGrossProfit
            .Select(r => ToRatingItem(r, GrossProfitContribution(r, totalGrossProfit, maxGrossProfit)))
            .ToList();

        var ratingAverageCheckItems = byAverageCheck
            .Select(r => ToRatingItem(r, AverageCheckContribution(r, groupAverageCheck, maxAverageCheck)))
            .ToList();

        var rating = new ManagerRatingModel([
            new DatasetModel<ManagerRatingItemModel>(BuilderCommon.DatasetNames.GrossProfit, ratingGrossProfitItems),
            new DatasetModel<ManagerRatingItemModel>(BuilderCommon.DatasetNames.AverageCheck, ratingAverageCheckItems),
        ]);

        // Блок 3: сравнение — топ-N тех же ранжирований, только метрика и Δ.
        var comparisonGrossProfitItems = byGrossProfit
            .Take(TopN)
            .Select(r => new ManagerComparisonItemModel(
                r.Person.Id, r.Person.Name, r.GrossProfit, r.GrossProfitDelta))
            .ToList();

        var comparisonAverageCheckItems = byAverageCheck
            .Take(TopN)
            .Select(r => new ManagerComparisonItemModel(
                r.Person.Id, r.Person.Name, r.AverageCheck, r.AverageCheckDelta))
            .ToList();

        var comparison = new ManagerComparisonModel([
            new DatasetModel<ManagerComparisonItemModel>(BuilderCommon.DatasetNames.GrossProfit, comparisonGrossProfitItems),
            new DatasetModel<ManagerComparisonItemModel>(BuilderCommon.DatasetNames.AverageCheck, comparisonAverageCheckItems),
        ]);

        return (rating, comparison);
    }

    /// <summary>
    /// Собирает строку одного менеджера: агрегаты текущего и предыдущего периодов
    /// (при отсутствии — нули), метрики домена и Δ; доля отмен гейтится порогом
    /// малой выборки.
    /// </summary>
    private ManagerRow BuildRow(
        ManagerRosterRow person,
        ManagerAggregateRow? currentRow,
        ManagerAggregateRow? previousRow)
    {
        // Агрегаты текущего периода; менеджер без сделок → нули.
        var revenue = currentRow?.Revenue ?? 0m;
        var cost = currentRow?.Cost ?? 0m;
        var paidCount = currentRow?.PaidCount ?? 0;
        var cancelledCount = currentRow?.CancelledCount ?? 0;

        // Агрегаты предыдущего периода — база Δ.
        var previousRevenue = previousRow?.Revenue ?? 0m;
        var previousCost = previousRow?.Cost ?? 0m;
        var previousPaidCount = previousRow?.PaidCount ?? 0;
        var previousCancelledCount = previousRow?.CancelledCount ?? 0;

        // Производные метрики (ВП, маржа, средний чек) считает доменный калькулятор.
        var currentMetrics = metrics.Calculate(revenue, cost, paidCount);

        var previousMetrics = metrics.Calculate(previousRevenue, previousCost, previousPaidCount);

        // Знаменатель доли отмен = оплаченные + отменённые в том же окне
        // (событийная доля, domain.md); при малой выборке доля не печатается.
        var cancellationRate = thresholds.HasEnoughCancellationSample(paidCount + cancelledCount)
            ? lossRates.CancellationRate(cancelledCount, paidCount)
            : null;

        var previousCancellationRate = thresholds.HasEnoughCancellationSample(previousPaidCount + previousCancelledCount)
            ? lossRates.CancellationRate(previousCancelledCount, previousPaidCount)
            : null;

        var row = new ManagerRow(
            Person: person,
            SalesCount: paidCount,
            Revenue: revenue,
            RevenueDelta: deltas.PercentDelta(revenue, previousRevenue),
            GrossProfit: currentMetrics.GrossProfit,
            GrossProfitDelta: deltas.PercentDelta(currentMetrics.GrossProfit, previousMetrics.GrossProfit),
            AverageCheck: currentMetrics.AverageCheck ?? 0m,
            AverageCheckDelta: deltas.PercentDelta(currentMetrics.AverageCheck ?? 0m, previousMetrics.AverageCheck ?? 0m),
            Margin: currentMetrics.Margin,
            MarginDelta: deltas.PointsDelta(currentMetrics.Margin, previousMetrics.Margin),
            CancellationRate: cancellationRate,
            CancellationRateDelta: deltas.PointsDelta(cancellationRate, previousCancellationRate));

        return row;
    }

    // Вклад по ВП: доля от суммы группы + длина бара от максимума.
    private ContributionModel GrossProfitContribution(ManagerRow row, decimal totalGrossProfit, decimal maxGrossProfit)
        => new(
            row.GrossProfit,
            contributions.RelativePercent(row.GrossProfit, totalGrossProfit),
            ContributionBasis.GrossProfit,
            contributions.BarLength(row.GrossProfit, maxGrossProfit));

    // Вклад по среднему чеку: кратность к среднему по группе + длина бара от максимума.
    private ContributionModel AverageCheckContribution(ManagerRow row, decimal groupAverageCheck, decimal maxAverageCheck)
        => new(
            row.AverageCheck,
            contributions.RelativeMultiple(row.AverageCheck, groupAverageCheck),
            ContributionBasis.AverageCheck,
            contributions.BarLength(row.AverageCheck, maxAverageCheck));

    private static ManagerRatingItemModel ToRatingItem(ManagerRow row, ContributionModel contribution)
        => new(
            row.Person.Id, row.Person.Name, row.Person.Avatar, row.Person.Initials, row.Person.Team,
            row.SalesCount, row.Revenue, row.RevenueDelta,
            row.GrossProfit, row.GrossProfitDelta,
            row.AverageCheck, row.AverageCheckDelta,
            row.Margin, row.MarginDelta,
            row.CancellationRate, row.CancellationRateDelta,
            contribution);

    private static Dictionary<Guid, ManagerAggregateRow> Index(IReadOnlyList<ManagerAggregateRow> rows)
        => rows.GroupBy(r => r.Id).ToDictionary(g => g.Key, g => g.First());

    private const int TopN = BuilderCommon.TopN;

    /// <summary>Внутренняя строка одного менеджера: агрегаты + выведенные метрики и Δ.</summary>
    private sealed record ManagerRow(
        ManagerRosterRow Person,
        int SalesCount,
        decimal Revenue,
        DeltaModel? RevenueDelta,
        decimal GrossProfit,
        DeltaModel? GrossProfitDelta,
        decimal AverageCheck,
        DeltaModel? AverageCheckDelta,
        decimal? Margin,
        DeltaModel? MarginDelta,
        decimal? CancellationRate,
        DeltaModel? CancellationRateDelta);
}
