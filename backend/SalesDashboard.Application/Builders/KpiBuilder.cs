using SalesDashboard.Application.Abstractions.Queries;
using SalesDashboard.Application.Models;
using SalesDashboard.Domain;

namespace SalesDashboard.Application.Builders;

/// <summary>Блок 1 (api.md): пять KPI-карточек плюс лидер периода.</summary>
public interface IKpiBuilder
{
    Task<KpiModel> BuildAsync(DashboardQuery query, CancellationToken cancellationToken);
}

/// <summary>
/// Строит KPI-карточки из сырых итогов периода и дневных строк. Доменные
/// калькуляторы выводят маржу, средний чек и каждую Δ; билдер только собирает
/// карточки. Серии денег/количеств печатают дни без продаж нулём (настоящий
/// ноль), тогда как серии маржи и среднего чека такие дни пропускают — их
/// значение там не определено, а не равно нулю (domain.md, «Недостаточность данных»).
/// </summary>
public sealed class KpiBuilder(
    IKpiReadPort kpiPort,
    IManagerReadPort managerPort,
    IPeriodResolver periodResolver,
    IResultMetricsCalculator metrics,
    IDeltaCalculator deltas,
    IDatasetRankingPolicy ranking) : IKpiBuilder
{
    public async Task<KpiModel> BuildAsync(DashboardQuery query, CancellationToken cancellationToken)
    {
        // Фильтр текущего периода (дата-диапазон + сегмент).
        var current = new ReadFilter(query.Period, query.Segment);

        // Предыдущий период равен активному по длительности и примыкает к нему;
        // Δ всех карточек сравнивает базы одного размера (domain.md).
        var previous = new ReadFilter(periodResolver.Previous(query.Period), query.Segment);

        // Итоги обоих периодов (суммы, счётчики) и дневной ряд текущего.
        var totals = await kpiPort.ReadTotalsAsync(current, cancellationToken);
        var previousTotals = await kpiPort.ReadTotalsAsync(previous, cancellationToken);
        var daily = await kpiPort.ReadDailyAsync(current, cancellationToken);

        // Производные метрики (ВП, маржа, средний чек) считает доменный калькулятор.
        var currentMetrics = metrics.Calculate(totals.Revenue, totals.Cost, totals.PaidCount);
        var previousMetrics = metrics.Calculate(previousTotals.Revenue, previousTotals.Cost, previousTotals.PaidCount);

        // Лидер периода — отдельный подблок с собственными чтениями.
        var bestManager = await BuildBestManagerAsync(current, previous, cancellationToken);

        // Деньги и счётчик — непрерывные серии с нулями в пустые дни; маржа и
        // средний чек в пустые дни не определены (0/0), поэтому их серии sparse.
        var model = new KpiModel(
            // Выручка: сумма периода, Δ%, непрерывная серия по дням.
            Revenue: new KpiCardModel(
                totals.Revenue,
                deltas.PercentDelta(totals.Revenue, previousTotals.Revenue),
                ContinuousSeries(query.Period, daily, d => d.Revenue)),
            // Валовая прибыль: из калькулятора, Δ%, серия Revenue − Cost по дням.
            GrossProfit: new KpiCardModel(
                currentMetrics.GrossProfit,
                deltas.PercentDelta(currentMetrics.GrossProfit, previousMetrics.GrossProfit),
                ContinuousSeries(query.Period, daily, d => d.Revenue - d.Cost)),
            // Маржа: из калькулятора, Δ в п.п., sparse-серия (в пустые дни 0/0).
            Margin: new KpiCardModel(
                currentMetrics.Margin,
                deltas.PointsDelta(currentMetrics.Margin, previousMetrics.Margin),
                SparseSeries(daily, MarginOfDay)),
            // Число продаж: счётчик когорты, Δ%, непрерывная серия по дням.
            SalesCount: new KpiCardModel(
                totals.PaidCount,
                deltas.PercentDelta(totals.PaidCount, previousTotals.PaidCount),
                ContinuousSeries(query.Period, daily, d => d.PaidCount)),
            // Средний чек: из калькулятора, Δ%, sparse-серия (в пустые дни 0/0).
            AverageCheck: new KpiCardModel(
                currentMetrics.AverageCheck,
                deltas.PercentDelta(currentMetrics.AverageCheck, previousMetrics.AverageCheck),
                SparseSeries(daily, AverageCheckOfDay)),
            BestManager: bestManager);

        return model;
    }

    /// <summary>
    /// Лидер по валовой прибыли за период или <c>null</c>, когда в нём ничего не
    /// было оплачено. Δ сравнивает собственную ВП лидера с его ВП в предыдущем
    /// периоде (api.md, <c>BestManagerDto.delta</c>).
    /// </summary>
    private async Task<BestManagerModel?> BuildBestManagerAsync(
        ReadFilter current,
        ReadFilter previous,
        CancellationToken cancellationToken)
    {
        // Агрегаты всех менеджеров текущего периода.
        var aggregates = await managerPort.ReadAggregatesAsync(current, cancellationToken);

        // Ничего не оплачено — лидера нет (api.md: null вместо карточки).
        if (aggregates.Count == 0)
            return null;

        // Лидер выбирается по ВП; при равной ВП выше ставится тот, у кого больше
        // выручка (domain.md, детерминированный tie-break).
        var leaders = ranking.OrderByMetricDescending(
            aggregates,
            a => a.Revenue - a.Cost,
            revenueTieBreak: a => a.Revenue,
            name: a => a.Id.ToString());

        // Верхняя строка рейтинга — лидер.
        var leader = leaders[0];

        // Данные карточки (имя, аватар, инициалы) берутся из реестра.
        var roster = await managerPort.ReadRosterAsync(cancellationToken);
        var person = roster.FirstOrDefault(m => m.Id == leader.Id);

        // Guard от рассинхронизации seed-данных и реестра (см. ниже).
        if (person is null)
            return null;

        // ВП лидера в предыдущем периоде — база Δ карточки.
        var previousAggregates = await managerPort.ReadAggregatesAsync(previous, cancellationToken);
        var previousLeader = previousAggregates.FirstOrDefault(a => a.Id == leader.Id);
        var previousGrossProfit = previousLeader is null ? 0m : previousLeader.Revenue - previousLeader.Cost;

        // Дневной ряд лидера — серия выручки карточки.
        var daily = await managerPort.ReadDailyByManagerAsync(leader.Id, current, cancellationToken);

        // Отсутствие лидера в реестре невозможно в консистентных данных (агрегаты
        // строятся по сделкам, привязанным к реестру); ветка оставлена как guard
        // от рассинхронизации seed-данных и реестра.

        var model = new BestManagerModel(
            Id: person.Id,
            Name: person.Name,
            Avatar: person.Avatar,
            Initials: person.Initials,
            GrossProfit: leader.Revenue - leader.Cost,
            SalesCount: leader.PaidCount,
            Delta: deltas.PercentDelta(leader.Revenue - leader.Cost, previousGrossProfit),
            Series: ContinuousSeries(current.Period, daily, d => d.Revenue));

        return model;
    }

    // Маржа дня: ВП / выручка × 100; в день без выручки не определена (0/0) → null.
    private static decimal? MarginOfDay(DailyAggregateRow d)
        => d.Revenue != 0 ? (d.Revenue - d.Cost) / d.Revenue * 100 : null;

    // Средний чек дня: выручка / число сделок; в день без сделок не определён → null.
    private static decimal? AverageCheckOfDay(DailyAggregateRow d)
        => d.PaidCount != 0 ? d.Revenue / d.PaidCount : null;

    /// <summary>Одна точка на каждый день периода; отсутствующие дни несут настоящий ноль.</summary>
    internal static IReadOnlyList<SeriesPointModel> ContinuousSeries(
        DateRange period,
        IReadOnlyList<DailyAggregateRow> daily,
        Func<DailyAggregateRow, decimal> selector)
    {
        // Индекс «день → значение метрики» для быстрой подстановки в точку серии.
        var byDay = daily.GroupBy(d => d.Date.Date).ToDictionary(g => g.Key, g => g.Sum(selector));

        return BuilderCommon
            .DaysOf(period)
            .Select(day => new SeriesPointModel(day, byDay.TryGetValue(day, out var value) ? value : 0m))
            .ToList();
    }

    /// <summary>Точки только для дней, где метрика определена (маржа, средний чек).</summary>
    internal static IReadOnlyList<SeriesPointModel> SparseSeries(
        IReadOnlyList<DailyAggregateRow> daily,
        Func<DailyAggregateRow, decimal?> selector)
        => daily
            .Where(d => selector(d) is not null)
            .OrderBy(d => d.Date)
            .Select(d => new SeriesPointModel(d.Date.Date, selector(d)!.Value))
            .ToList();
}