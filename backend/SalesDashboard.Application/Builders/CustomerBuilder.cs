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
    /// Динамика клиентов: строки с честной базой делятся на секции «Рост» и
    /// «Падение» — топ-<c>Dyn Top N</c> по абсолютной Δ в каждой (domain.md,
    /// «Динамика клиентов»). Честная база = обе относительные Δ вычислимы: счётчик
    /// оплат недостаточен, потому что целиком возвращённая оплата входит в
    /// PaidCount, но даёт нулевую денежную базу (Revenue/GP = 0) → Δ = null,
    /// а строка с прочерком вместо относительной Δ в секции бессмысленна
    /// (domain.md, пустой знаменатель). В секции те же два датасета метрик;
    /// нормирование бара — к максимуму своей секции датасета.
    /// </summary>
    private CustomerDynamicsModel BuildDynamics(IReadOnlyList<CustomerRow> rows)
    {
        // Фильтр честной базы: обе относительные Δ существуют → в любой
        // секции у строки будет заполненная Δ, а не прочерк.
        var comparable = rows
            .Where(r => r.GrossProfitDelta is not null && r.AverageCheckDelta is not null)
            .ToList();

        var topN = thresholds.DynTopN;

        var grossProfitGrowth = GrowthSectionOf(comparable, r => r.GrossProfitSwing, r => r.Name, topN);
        var averageCheckGrowth = GrowthSectionOf(comparable, r => r.AverageCheckSwing, r => r.Name, topN);
        var grossProfitDecline = DeclineSectionOf(comparable, r => r.GrossProfitSwing, r => r.Name, topN);
        var averageCheckDecline = DeclineSectionOf(comparable, r => r.AverageCheckSwing, r => r.Name, topN);

        var grossProfitGrowthMax = MaxSwingOf(grossProfitGrowth, r => r.GrossProfitSwing);
        var averageCheckGrowthMax = MaxSwingOf(averageCheckGrowth, r => r.AverageCheckSwing);
        var grossProfitDeclineMax = MaxSwingOf(grossProfitDecline, r => r.GrossProfitSwing);
        var averageCheckDeclineMax = MaxSwingOf(averageCheckDecline, r => r.AverageCheckSwing);

        var grossProfitGrowthItems = ToItems(grossProfitGrowth, r => new CustomerDynamicsItemModel(
            r.Id, r.Name, NormalizedSwing(r.GrossProfitSwing, grossProfitGrowthMax),
            r.GrossProfitSwing, r.GrossProfitDelta));

        var averageCheckGrowthItems = ToItems(averageCheckGrowth, r => new CustomerDynamicsItemModel(
            r.Id, r.Name, NormalizedSwing(r.AverageCheckSwing, averageCheckGrowthMax),
            r.AverageCheckSwing, r.AverageCheckDelta));

        var grossProfitDeclineItems = ToItems(grossProfitDecline, r => new CustomerDynamicsItemModel(
            r.Id, r.Name, NormalizedSwing(Math.Abs(r.GrossProfitSwing), grossProfitDeclineMax),
            r.GrossProfitSwing, r.GrossProfitDelta));

        var averageCheckDeclineItems = ToItems(averageCheckDecline, r => new CustomerDynamicsItemModel(
            r.Id, r.Name, NormalizedSwing(Math.Abs(r.AverageCheckSwing), averageCheckDeclineMax),
            r.AverageCheckSwing, r.AverageCheckDelta));

        var growth = new List<DatasetModel<CustomerDynamicsItemModel>>
        {
            new(BuilderCommon.DatasetNames.GrossProfit, grossProfitGrowthItems),
            new(BuilderCommon.DatasetNames.AverageCheck, averageCheckGrowthItems),
        };

        var decline = new List<DatasetModel<CustomerDynamicsItemModel>>
        {
            new(BuilderCommon.DatasetNames.GrossProfit, grossProfitDeclineItems),
            new(BuilderCommon.DatasetNames.AverageCheck, averageCheckDeclineItems),
        };

        var model = new CustomerDynamicsModel(growth, decline);

        return model;
    }

    /// <summary>
    /// Секция роста одного датасета: клиенты с положительным размахом метрики,
    /// топ-N по убыванию размаха.
    /// </summary>
    private IReadOnlyList<CustomerRow> GrowthSectionOf(
        IReadOnlyList<CustomerRow> rows,
        Func<CustomerRow, decimal> swing,
        Func<CustomerRow, string> name,
        int topN)
    {
        var positive = rows
            .Where(r => swing(r) > 0m)
            .ToList();

        var ranked = ranking.OrderByMetricDescending(positive, swing, revenueTieBreak: null, name);

        var section = ranked
            .Take(topN)
            .ToList();

        return section;
    }

    /// <summary>
    /// Секция падения одного датасета: клиенты с отрицательным размахом
    /// метрики, топ-N по возрастанию размаха (от большего минуса к нулю).
    /// </summary>
    private IReadOnlyList<CustomerRow> DeclineSectionOf(
        IReadOnlyList<CustomerRow> rows,
        Func<CustomerRow, decimal> swing,
        Func<CustomerRow, string> name,
        int topN)
    {
        var negative = rows
            .Where(r => swing(r) < 0m)
            .ToList();

        var ranked = ranking.OrderByMetricAscending(negative, swing, revenueTieBreak: null, name);

        var section = ranked
            .Take(topN)
            .ToList();

        return section;
    }

    /// <summary>Переносит строки секции в item'ы по фабрике (нормирование — внутри фабрики).</summary>
    private IReadOnlyList<CustomerDynamicsItemModel> ToItems(
        IReadOnlyList<CustomerRow> rows,
        Func<CustomerRow, CustomerDynamicsItemModel> toItem)
    {
        var items = rows
            .Select(toItem)
            .ToList();

        return items;
    }

    /// <summary>
    /// Максимум модуля размаха по секции — база нормирования баров
    /// (макет renderClientDynamics: len = |d| / maxAbs · halfW).
    /// </summary>
    private static decimal MaxSwingOf(IReadOnlyList<CustomerRow> rows, Func<CustomerRow, decimal> swing)
        => rows.Count == 0 ? 0m : rows.Max(r => Math.Abs(swing(r)));

    /// <summary>
    /// Длина бара 0–100: модуль размаха, нормированный к максимуму секции.
    /// Нормирование к относительной Δ (clamp ±100) непригодно: у
    /// неаддитивного среднего чека почти все строки прижимаются к потолку —
    /// бары одинаковой длины, а порядок при равенстве решается по имени.
    /// </summary>
    private static decimal NormalizedSwing(decimal swing, decimal maxSwing)
        => maxSwing == 0m ? 0m : swing / maxSwing * 100m;

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
            GrossProfitSwing: currentMetrics.GrossProfit - previousMetrics.GrossProfit,
            AverageCheckSwing: (currentMetrics.AverageCheck ?? 0m) - (previousMetrics.AverageCheck ?? 0m));
    }

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

    /// <summary>
    /// Внутренняя строка одного клиента: агрегаты + выведенные метрики и Δ.
    /// <c>OrderCount</c>/<c>PreviousOrderCount</c> — счётчики оплат в блоках
    /// топа; фильтр динамики опирается на вычислимость Δ, а не на счётчики
    /// (целиком возвращённая оплата входит в счётчик, но даёт нулевую базу).
    /// </summary>
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
