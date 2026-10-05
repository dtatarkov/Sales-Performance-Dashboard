using SalesDashboard.Application.Abstractions.Queries;
using SalesDashboard.Application.Models;
using SalesDashboard.Domain;

namespace SalesDashboard.Application.Builders;

/// <summary>
/// Блоки клиентов (api.md, блоки 4 и 5): график топ-10 и график динамики. Оба
/// сравнивают активный период с предыдущим и разделяют те же два чтения.
/// </summary>
public interface ICustomerBuilder
{
    Task<(CustomerTopModel Top, CustomerDynamicsModel Dynamics)> BuildAsync(
        DashboardQuery query,
        CancellationToken cancellationToken);
}

public sealed class CustomerBuilder(
    ICustomerReadPort customerPort,
    IPeriodResolver periodResolver,
    IResultMetricsCalculator metrics,
    IContributionCalculator contributions,
    IDeltaCalculator deltas,
    IDatasetRankingPolicy ranking,
    ILossRateCalculator lossRates,
    MetricThresholds thresholds) : ICustomerBuilder
{
    /// <summary>
    /// Читает агрегаты обоих периодов и строит два блока из одних и тех же строк:
    /// топ-10 клиентов и динамику. Клиент без прошлых продаж сравнивается с
    /// нулевой базой — Δ таких строк становится null (domain.md, пустой знаменатель).
    /// </summary>
    public async Task<(CustomerTopModel Top, CustomerDynamicsModel Dynamics)> BuildAsync(
        DashboardQuery query,
        CancellationToken cancellationToken)
    {
        var current = new ReadFilter(query.Period, query.Segment);
        var previous = new ReadFilter(periodResolver.Previous(query.Period), query.Segment);

        var currentRows = await customerPort.ReadAggregatesAsync(current, cancellationToken);
        var previousRows = await customerPort.ReadAggregatesAsync(previous, cancellationToken);

        var previousById = previousRows
            .GroupBy(r => r.Id)
            .ToDictionary(g => g.Key, g => g.First());

        // Клиент без сделок в предыдущем периоде сравнивается с нулевой базой:
        // Δ будет null (деление на ноль не допускается), а не фантастическим +%.
        var rows = currentRows
            .Select(rowCurrent => BuildRow(
                rowCurrent,
                previousById.TryGetValue(rowCurrent.Id, out var prev) ? prev : null))
            .ToList();

        var top = BuildTop(rows);
        var dynamics = BuildDynamics(rows);

        return (top, dynamics);
    }

    /// <summary>
    /// Топ-10 клиентов в двух датасетах. «Валовая прибыль» нормирует вклад долей
    /// от суммы группы, «Средний чек» — кратностью к среднему по группе (api.md,
    /// блок 4); оба датасета ранжируются независимо.
    /// </summary>
    private CustomerTopModel BuildTop(IReadOnlyList<CustomerRow> rows)
    {
        var totalGrossProfit = rows.Sum(r => r.GrossProfit);
        var totalPaidCount = rows.Sum(r => r.OrderCount);
        var groupAverageCheck = totalPaidCount > 0 ? rows.Sum(r => r.Revenue) / totalPaidCount : 0m;
        var maxGrossProfit = rows.Count == 0 ? 0m : rows.Max(r => r.GrossProfit);
        var maxAverageCheck = rows.Count == 0 ? 0m : rows.Max(r => r.AverageCheck);

        var grossProfitDataset = BuildGrossProfitTopDataset(rows, totalGrossProfit, maxGrossProfit);
        var averageCheckDataset = BuildAverageCheckTopDataset(rows, groupAverageCheck, maxAverageCheck);

        var model = new CustomerTopModel([grossProfitDataset, averageCheckDataset]);

        return model;
    }

    /// <summary>
    /// Датасет топа «Валовая прибыль»: ранжирование по ВП, вклад — доля от суммы
    /// группы (api.md, блок 4).
    /// </summary>
    private DatasetModel<CustomerTopItemModel> BuildGrossProfitTopDataset(
        IReadOnlyList<CustomerRow> rows,
        decimal totalGrossProfit,
        decimal maxGrossProfit)
    {
        var byGrossProfit = ranking.OrderByMetricDescending(
            rows, r => r.GrossProfit, revenueTieBreak: null, name: r => r.Name);

        var items = byGrossProfit
            .Take(TopN)
            .Select(r => ToTopItem(r, GrossProfitContribution(r, totalGrossProfit, maxGrossProfit)))
            .ToList();

        return new DatasetModel<CustomerTopItemModel>(BuilderCommon.DatasetNames.GrossProfit, items);
    }

    /// <summary>
    /// Датасет топа «Средний чек»: ранжирование по среднему чеку, вклад —
    /// кратность к среднему по группе (api.md, блок 4).
    /// </summary>
    private DatasetModel<CustomerTopItemModel> BuildAverageCheckTopDataset(
        IReadOnlyList<CustomerRow> rows,
        decimal groupAverageCheck,
        decimal maxAverageCheck)
    {
        var byAverageCheck = ranking.OrderByMetricDescending(
            rows, r => r.AverageCheck, revenueTieBreak: null, name: r => r.Name);

        var items = byAverageCheck
            .Take(TopN)
            .Select(r => ToTopItem(r, AverageCheckContribution(r, groupAverageCheck, maxAverageCheck)))
            .ToList();

        return new DatasetModel<CustomerTopItemModel>(BuilderCommon.DatasetNames.AverageCheck, items);
    }

    /// <summary>
    /// Динамика клиентов: после порога «достаточной базы» строки ранжируются по
    /// размаху ВП и среднего чека между периодами (domain.md, «Dyn Min Base Orders»).
    /// </summary>
    private CustomerDynamicsModel BuildDynamics(IReadOnlyList<CustomerRow> rows)
    {
        // Выживают только клиенты с достаточным числом заказов в базовом периоде —
        // маленькие выборки резко колеблются и затопили бы сигнал (domain.md, «Dyn Min Base Orders»).
        var eligible = rows
            .Where(r => thresholds.HasEnoughDynamicsBase(r.PreviousOrderCount))
            .ToList();

        var grossProfitDataset = BuildGrossProfitDynamicsDataset(eligible);
        var averageCheckDataset = BuildAverageCheckDynamicsDataset(eligible);

        var model = new CustomerDynamicsModel([grossProfitDataset, averageCheckDataset]);

        return model;
    }

    /// <summary>Датасет динамики «Валовая прибыль»: ранжирование по размаху ВП между периодами.</summary>
    private DatasetModel<CustomerDynamicsItemModel> BuildGrossProfitDynamicsDataset(IReadOnlyList<CustomerRow> eligible)
    {
        var byGrossProfit = ranking.OrderByMetricDescending(
            eligible, r => r.GrossProfitSwing, revenueTieBreak: null, name: r => r.Name);

        var items = byGrossProfit
            .Select(r => new CustomerDynamicsItemModel(
                r.Id, r.Name, r.GrossProfitSwing, r.GrossProfitDelta))
            .ToList();

        return new DatasetModel<CustomerDynamicsItemModel>(BuilderCommon.DatasetNames.GrossProfit, items);
    }

    /// <summary>Датасет динамики «Средний чек»: ранжирование по размаху среднего чека между периодами.</summary>
    private DatasetModel<CustomerDynamicsItemModel> BuildAverageCheckDynamicsDataset(IReadOnlyList<CustomerRow> eligible)
    {
        var byAverageCheck = ranking.OrderByMetricDescending(
            eligible, r => r.AverageCheckSwing, revenueTieBreak: null, name: r => r.Name);

        var items = byAverageCheck
            .Select(r => new CustomerDynamicsItemModel(
                r.Id, r.Name, r.AverageCheckSwing, r.AverageCheckDelta))
            .ToList();

        return new DatasetModel<CustomerDynamicsItemModel>(BuilderCommon.DatasetNames.AverageCheck, items);
    }

    /// <summary>
    /// Соединяет текущие агрегаты клиента с предыдущими и выводит все метрики
    /// блока: ВП, маржу, средний чек, обе доли потерь с порогами малой выборки
    /// и Δ по каждой величине.
    /// </summary>
    private CustomerRow BuildRow(CustomerAggregateRow rowCurrent, CustomerAggregateRow? rowPrevious)
    {
        var currentMetrics = metrics.Calculate(rowCurrent.Revenue, rowCurrent.Cost, rowCurrent.PaidCount);

        var previousMetrics = metrics.Calculate(
            rowPrevious?.Revenue ?? 0m,
            rowPrevious?.Cost ?? 0m,
            rowPrevious?.PaidCount ?? 0);

        var refundRate = thresholds.HasEnoughRefundSample(rowCurrent.PaidCount)
            ? lossRates.RefundRate(rowCurrent.RefundedCount, rowCurrent.PaidCount)
            : null;

        // Доля возвратов — когортная (знаменатель = оплаченная когорта), отбор
        // по refund-датам делает порт; здесь только порог и деление.
        var previousRefundRate = rowPrevious is not null && thresholds.HasEnoughRefundSample(rowPrevious.PaidCount)
            ? lossRates.RefundRate(rowPrevious.RefundedCount, rowPrevious.PaidCount)
            : null;

        // Доля отмен — событийная: знаменатель = оплаченные + отменённые.
        var cancellationRate = thresholds.HasEnoughCancellationSample(rowCurrent.PaidCount + rowCurrent.CancelledCount)
            ? lossRates.CancellationRate(rowCurrent.CancelledCount, rowCurrent.PaidCount)
            : null;

        var previousCancellationRate = rowPrevious is not null
            && thresholds.HasEnoughCancellationSample(rowPrevious.PaidCount + rowPrevious.CancelledCount)
            ? lossRates.CancellationRate(rowPrevious.CancelledCount, rowPrevious.PaidCount)
            : null;

        return new CustomerRow(
            Id: rowCurrent.Id,
            Name: rowCurrent.Name,
            Since: rowCurrent.Since,
            OrderCount: rowCurrent.PaidCount,
            PreviousOrderCount: rowPrevious?.PaidCount ?? 0,
            Revenue: rowCurrent.Revenue,
            RevenueDelta: deltas.PercentDelta(rowCurrent.Revenue, rowPrevious?.Revenue ?? 0m),
            GrossProfit: currentMetrics.GrossProfit,
            GrossProfitDelta: deltas.PercentDelta(currentMetrics.GrossProfit, previousMetrics.GrossProfit),
            AverageCheck: currentMetrics.AverageCheck ?? 0m,
            AverageCheckDelta: deltas.PercentDelta(currentMetrics.AverageCheck ?? 0m, previousMetrics.AverageCheck ?? 0m),
            Margin: currentMetrics.Margin,
            MarginDelta: deltas.PointsDelta(currentMetrics.Margin, previousMetrics.Margin),
            RefundRate: refundRate,
            RefundRateDelta: deltas.PointsDelta(refundRate, previousRefundRate),
            CancellationRate: cancellationRate,
            CancellationRateDelta: deltas.PointsDelta(cancellationRate, previousCancellationRate),
            GrossProfitSwing: Swing(deltas.PercentDelta(currentMetrics.GrossProfit, previousMetrics.GrossProfit)),
            AverageCheckSwing: Swing(deltas.PercentDelta(currentMetrics.AverageCheck ?? 0m, previousMetrics.AverageCheck ?? 0m)));
    }

    /// <summary>Знаковое значение бара −100…100: относительная Δ, прижатая к диапазону графика.</summary>
    private static decimal Swing(DeltaModel? delta)
        => delta is null ? 0m : Math.Clamp(delta.Value, -100m, 100m);

    private ContributionModel GrossProfitContribution(CustomerRow row, decimal totalGrossProfit, decimal maxGrossProfit)
        => new(
            row.GrossProfit,
            contributions.RelativePercent(row.GrossProfit, totalGrossProfit),
            ContributionBasis.GrossProfit,
            contributions.BarLength(row.GrossProfit, maxGrossProfit));

    private ContributionModel AverageCheckContribution(CustomerRow row, decimal groupAverageCheck, decimal maxAverageCheck)
        => new(
            row.AverageCheck,
            contributions.RelativeMultiple(row.AverageCheck, groupAverageCheck),
            ContributionBasis.AverageCheck,
            contributions.BarLength(row.AverageCheck, maxAverageCheck));

    private static CustomerTopItemModel ToTopItem(CustomerRow row, ContributionModel contribution)
        => new(
            row.Id, row.Name, row.Since, row.OrderCount,
            row.Revenue, row.RevenueDelta,
            row.GrossProfit, row.GrossProfitDelta,
            row.AverageCheck, row.AverageCheckDelta,
            row.Margin, row.MarginDelta,
            row.RefundRate, row.RefundRateDelta,
            row.CancellationRate, row.CancellationRateDelta,
            contribution);

    private const int TopN = BuilderCommon.TopN;

    /// <summary>Внутренняя строка одного клиента: агрегаты + выведенные метрики и Δ.</summary>
    private sealed record CustomerRow(
        Guid Id,
        string Name,
        int Since,
        int OrderCount,
        int PreviousOrderCount,
        decimal Revenue,
        DeltaModel? RevenueDelta,
        decimal GrossProfit,
        DeltaModel? GrossProfitDelta,
        decimal AverageCheck,
        DeltaModel? AverageCheckDelta,
        decimal? Margin,
        DeltaModel? MarginDelta,
        decimal? RefundRate,
        DeltaModel? RefundRateDelta,
        decimal? CancellationRate,
        DeltaModel? CancellationRateDelta,
        decimal GrossProfitSwing,
        decimal AverageCheckSwing);
}
