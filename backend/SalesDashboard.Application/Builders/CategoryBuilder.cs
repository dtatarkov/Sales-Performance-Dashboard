using SalesDashboard.Application.Abstractions.Queries;
using SalesDashboard.Application.Models;
using SalesDashboard.Domain;

namespace SalesDashboard.Application.Builders;

/// <summary>Блок 7 (api.md): продажи по категориям, два переключаемых набора.</summary>
public interface ICategoryBuilder
{
    Task<CategoriesModel> BuildAsync(DashboardQuery query, CancellationToken cancellationToken);
}

/// <summary>
/// Строит наборы выручки и валовой прибыли по категориям. Каждый набор несёт
/// свою сумму (центр бублика) и долю каждой строки от этой суммы; возвраты
/// намеренно вне области здесь (api.md, примечание к блоку 7).
/// </summary>
public sealed class CategoryBuilder(
    ICategoryReadPort categoryPort,
    IPeriodResolver periodResolver,
    IResultMetricsCalculator metrics,
    IDeltaCalculator deltas,
    IDatasetRankingPolicy ranking) : ICategoryBuilder
{
    public async Task<CategoriesModel> BuildAsync(DashboardQuery query, CancellationToken cancellationToken)
    {
        // Формируем фильтр для текущего периода (дата-диапазон + сегмент).
        var current = new ReadFilter(query.Period, query.Segment);
        // Формируем фильтр для предыдущего периода того же размера (для сравнения).
        var previous = new ReadFilter(periodResolver.Previous(query.Period), query.Segment);

        // Читаем агрегаты по категориям из порта данных (выручка, прибыль, продажи).
        var currentRows = await categoryPort.ReadAggregatesAsync(current, cancellationToken);
        // Читаем агрегаты за предыдущий период для вычисления Δ.
        var previousRows = await categoryPort.ReadAggregatesAsync(previous, cancellationToken);

        // Индексируем предыдущие строки по Id категории для быстрого поиска.
        // GroupBy + ToDictionary защищает от дубликатов (одна категория — одна строка).
        var previousById = previousRows
            .GroupBy(r => r.Id)
            .ToDictionary(g => g.Key, g => g.First());

        // Проецируем текущие строки: для каждой ищем предыдущую и строим CategoryRow с Δ.
        // Если категории не было в прошлом периоде — передаём null (Δ станет null).
        var rows = currentRows
            .Select(rowCurrent => BuildRow(
                rowCurrent,
                previousById.TryGetValue(rowCurrent.Id, out var prev) ? prev : null))
            .ToList();

        var model = new CategoriesModel([
            BuildDataset(rows, BuilderCommon.DatasetNames.Revenue, r => r.Revenue),
            BuildDataset(rows, BuilderCommon.DatasetNames.GrossProfit, r => r.GrossProfit),
        ]);

        return model;
    }

    private CategoryDatasetModel BuildDataset(
        IReadOnlyList<CategoryRow> rows,
        string name,
        Func<CategoryRow, decimal> metric)
    {
        var total = rows.Sum(metric);
        var ordered = ranking.OrderByMetricDescending(rows, metric, revenueTieBreak: null, name: r => r.Name);

        // Процент каждой строки от суммы набора (share) — сегмент бублика.
        // Если total == 0 (набор пуст или все метрики нулевые), share = 0.
        var items = ordered.Select(r =>
        {
            var share = total != 0 ? metric(r) / total * 100 : 0m;

            return new CategoryItemModel(
                r.Id, r.Name,
                r.Revenue, r.RevenueDelta,
                r.GrossProfit, r.GrossProfitDelta,
                r.Margin, r.MarginDelta,
                r.SalesCount, r.SalesCountDelta,
                share);
        }).ToList();

        return new CategoryDatasetModel(name, items, total);
    }

    /// <summary>
    /// Строит строку категории из текущих и предыдущих агрегатов.
    /// </summary>
    /// <remarks>
    /// Edge case: если категории не было в предыдущем периоде (rowPrevious == null),
    /// все Δ становятся null вместо неопределённого процента от нуля.
    /// </remarks>
    private CategoryRow BuildRow(CategoryAggregateRow rowCurrent, CategoryAggregateRow? rowPrevious)
    {
        var currentMetrics = metrics.Calculate(rowCurrent.Revenue, rowCurrent.Cost, rowCurrent.SalesCount);

        var previousMetrics = metrics.Calculate(
            rowPrevious?.Revenue ?? 0m,
            rowPrevious?.Cost ?? 0m,
            rowPrevious?.SalesCount ?? 0);

        var row = new CategoryRow(
            Id: rowCurrent.Id,
            Name: rowCurrent.Name,
            Revenue: rowCurrent.Revenue,
            RevenueDelta: deltas.PercentDelta(rowCurrent.Revenue, rowPrevious?.Revenue ?? 0m),
            GrossProfit: currentMetrics.GrossProfit,
            GrossProfitDelta: deltas.PercentDelta(currentMetrics.GrossProfit, previousMetrics.GrossProfit),
            Margin: currentMetrics.Margin,
            MarginDelta: deltas.PointsDelta(currentMetrics.Margin, previousMetrics.Margin),
            SalesCount: rowCurrent.SalesCount,
            SalesCountDelta: deltas.PercentDelta(rowCurrent.SalesCount, rowPrevious?.SalesCount ?? 0));

        return row;
    }

    private const int TopN = BuilderCommon.TopN;

    /// <summary>Внутренняя строка одной категории: агрегаты + выведенные метрики и Δ.</summary>
    private sealed record CategoryRow(
        Guid Id,
        string Name,
        decimal Revenue,
        DeltaModel? RevenueDelta,
        decimal GrossProfit,
        DeltaModel? GrossProfitDelta,
        decimal? Margin,
        DeltaModel? MarginDelta,
        int SalesCount,
        DeltaModel? SalesCountDelta);
}
