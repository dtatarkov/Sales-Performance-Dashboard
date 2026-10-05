using SalesDashboard.Application.Abstractions.Queries;
using SalesDashboard.Application.Models;
using SalesDashboard.Domain;

namespace SalesDashboard.Application.Builders;

/// <summary>Блок 8 (api.md): топ-10 товаров, три переключаемых набора.</summary>
public interface IProductBuilder
{
    Task<ProductsModel> BuildAsync(DashboardQuery query, CancellationToken cancellationToken);
}

/// <summary>
/// Строит наборы выручки, валовой прибыли и проданных единиц по товарам.
/// Доля вклада каждой строки считается относительно метрики активного набора
/// (api.md, примечание к блоку 8). Возвраты этого товара — часть строки,
/// единый источник истины по суммам (api.md, примечание к блоку 7).
/// </summary>
public sealed class ProductBuilder(
    IProductReadPort productPort,
    IPeriodResolver periodResolver,
    IResultMetricsCalculator metrics,
    IContributionCalculator contributions,
    IDeltaCalculator deltas,
    IDatasetRankingPolicy ranking,
    ILossRateCalculator lossRates,
    MetricThresholds thresholds) : IProductBuilder
{
    public async Task<ProductsModel> BuildAsync(DashboardQuery query, CancellationToken cancellationToken)
    {
        // Фильтр текущего периода (дата-диапазон + сегмент).
        var current = new ReadFilter(query.Period, query.Segment);

        // Фильтр предыдущего периода того же размера — база для Δ.
        var previous = new ReadFilter(periodResolver.Previous(query.Period), query.Segment);

        // Агрегаты по товарам обоих периодов.
        var currentRows = await productPort.ReadAggregatesAsync(current, cancellationToken);
        var previousRows = await productPort.ReadAggregatesAsync(previous, cancellationToken);

        // Индекс предыдущих строк по Id товара для быстрого поиска пары.
        var previousById = previousRows
            .GroupBy(r => r.Id)
            .ToDictionary(g => g.Key, g => g.First());

        // Строка товара = текущие агрегаты + выведенные метрики и Δ.
        var rows = currentRows
            .Select(rowCurrent => BuildRow(
                rowCurrent,
                previousById.TryGetValue(rowCurrent.Id, out var prev) ? prev : null))
            .ToList();

        // Три датасета блока различаются метрикой ранжирования и базой вклада.
        return new ProductsModel([
            BuildDataset(rows, BuilderCommon.DatasetNames.Revenue, r => r.Revenue, ContributionBasis.Revenue),
            BuildDataset(rows, BuilderCommon.DatasetNames.GrossProfit, r => r.GrossProfit, ContributionBasis.GrossProfit),
            BuildDataset(rows, BuilderCommon.DatasetNames.Units, r => r.Units, ContributionBasis.Units),
        ]);
    }

    private DatasetModel<ProductItemModel> BuildDataset(
        IReadOnlyList<ProductRow> rows,
        string name,
        Func<ProductRow, decimal> metric,
        ContributionBasis basis)
    {
        // Сумма метрики по всем товарам — знаменатель доли вклада.
        var total = rows.Sum(metric);

        // Максимум метрики — эталон длины баров.
        var groupMax = rows.Count == 0 ? 0m : rows.Max(metric);

        // Ранжирование по метрике набора (по убыванию).
        var ordered = ranking.OrderByMetricDescending(rows, metric, revenueTieBreak: null, name: r => r.Name);

        // Топ-N товаров с вкладом относительно активной метрики.
        var items = ordered.Take(TopN)
            .Select(r => ToItem(r, metric(r), total, groupMax, basis))
            .ToList();

        return new DatasetModel<ProductItemModel>(name, items);
    }

    private ProductItemModel ToItem(
        ProductRow row,
        decimal metricValue,
        decimal total,
        decimal groupMax,
        ContributionBasis basis)
        => new(
            row.Id, row.Name, row.Sku, row.Category,
            row.Revenue, row.RevenueDelta,
            row.GrossProfit, row.GrossProfitDelta,
            row.Units, row.UnitsDelta,
            row.Margin, row.MarginDelta,
            row.RefundRate, row.RefundRateDelta,
            new ContributionModel(
                metricValue,
                contributions.RelativePercent(metricValue, total),
                basis,
                contributions.BarLength(metricValue, groupMax)));

    /// <summary>
    /// Строит строку товара из текущих и предыдущих агрегатов.
    /// </summary>
    /// <remarks>
    /// Edge case: товара не было в предыдущем периоде (rowPrevious == null) —
    /// сравнение с нулевой базой, все Δ становятся null.
    /// </remarks>
    private ProductRow BuildRow(ProductAggregateRow rowCurrent, ProductAggregateRow? rowPrevious)
    {
        // Производные метрики (ВП, маржа) считает доменный калькулятор.
        var currentMetrics = metrics.Calculate(rowCurrent.Revenue, rowCurrent.Cost, rowCurrent.PaidCount);

        var previousMetrics = metrics.Calculate(
            rowPrevious?.Revenue ?? 0m,
            rowPrevious?.Cost ?? 0m,
            rowPrevious?.PaidCount ?? 0);

        // Порог малой выборки по сделкам (не по позициям): товар встречается
        // несколько раз в одной сделке, но сделка в знаменателе одна.
        var refundRate = thresholds.HasEnoughRefundSample(rowCurrent.PaidCount)
            ? lossRates.RefundRate(rowCurrent.RefundedCount, rowCurrent.PaidCount)
            : null;

        var previousRefundRate = rowPrevious is not null && thresholds.HasEnoughRefundSample(rowPrevious.PaidCount)
            ? lossRates.RefundRate(rowPrevious.RefundedCount, rowPrevious.PaidCount)
            : null;

        var row = new ProductRow(
            Id: rowCurrent.Id,
            Name: rowCurrent.Name,
            Sku: rowCurrent.Sku,
            Category: rowCurrent.Category,
            Revenue: rowCurrent.Revenue,
            RevenueDelta: deltas.PercentDelta(rowCurrent.Revenue, rowPrevious?.Revenue ?? 0m),
            GrossProfit: currentMetrics.GrossProfit,
            GrossProfitDelta: deltas.PercentDelta(currentMetrics.GrossProfit, previousMetrics.GrossProfit),
            Margin: currentMetrics.Margin,
            MarginDelta: deltas.PointsDelta(currentMetrics.Margin, previousMetrics.Margin),
            Units: rowCurrent.Units,
            UnitsDelta: deltas.PercentDelta(rowCurrent.Units, rowPrevious?.Units ?? 0),
            RefundRate: refundRate,
            RefundRateDelta: deltas.PointsDelta(refundRate, previousRefundRate));

        return row;
    }

    private const int TopN = BuilderCommon.TopN;

    /// <summary>Внутренняя строка одного товара: агрегаты + выведенные метрики и Δ.</summary>
    private sealed record ProductRow(
        Guid Id,
        string Name,
        string Sku,
        string Category,
        decimal Revenue,
        DeltaModel? RevenueDelta,
        decimal GrossProfit,
        DeltaModel? GrossProfitDelta,
        decimal? Margin,
        DeltaModel? MarginDelta,
        int Units,
        DeltaModel? UnitsDelta,
        decimal? RefundRate,
        DeltaModel? RefundRateDelta);
}
