using SalesDashboard.Application.Abstractions.Queries;
using SalesDashboard.Application.Models;
using SalesDashboard.Domain;

namespace SalesDashboard.Application.Builders;

/// <summary>Блоки 10 и 11 (api.md): возвраты и отмены периода.</summary>
public interface ILossBuilder
{
    Task<(RefundsModel Refunds, CancellationsModel Cancellations)> BuildAsync(
        DashboardQuery query,
        CancellationToken cancellationToken);
}

/// <summary>
/// Строит два независимых блока потерь из сумм по дате события. Возвраты — это
/// когортная доля (знаменатель = оплаченная когорта) с разбивкой по товарам;
/// отмены — событийная доля (знаменатель = оплаченные + отменённые) с разбивкой
/// по менеджерам (domain.md, «Когорта и событие» / «Ответственность»).
/// </summary>
public sealed class LossBuilder(
    ILossReadPort lossPort,
    IPeriodResolver periodResolver,
    ILossRateCalculator lossRates,
    IDeltaCalculator deltas,
    IContributionCalculator contributions,
    IDatasetRankingPolicy ranking) : ILossBuilder
{
    public async Task<(RefundsModel Refunds, CancellationsModel Cancellations)> BuildAsync(
        DashboardQuery query,
        CancellationToken cancellationToken)
    {
        // Фильтр текущего периода (дата-диапазон + сегмент).
        var current = new ReadFilter(query.Period, query.Segment);

        // Фильтр предыдущего периода того же размера — база для Δ.
        var previous = new ReadFilter(periodResolver.Previous(query.Period), query.Segment);

        // Итоги потерь обоих периодов: суммы, счётчики когорт.
        var totals = await lossPort.ReadTotalsAsync(current, cancellationToken);
        var previousTotals = await lossPort.ReadTotalsAsync(previous, cancellationToken);

        // Дневные ряды и разрезы текущего периода для графиков и топов.
        var refundedDaily = await lossPort.ReadRefundedDailyAsync(current, cancellationToken);
        var cancelledDaily = await lossPort.ReadCancelledDailyAsync(current, cancellationToken);
        var refundedByProduct = await lossPort.ReadRefundedByProductAsync(current, cancellationToken);
        var cancelledByManager = await lossPort.ReadCancelledByManagerAsync(current, cancellationToken);

        // Доля возвратов — когортная: возвращённые сделки / оплаченная когорта.
        var refundRate = lossRates.RefundRate(totals.CohortRefundedCount, totals.PaidCount);

        // То же для предыдущего периода — база Δ.
        var previousRefundRate = lossRates.RefundRate(previousTotals.CohortRefundedCount, previousTotals.PaidCount);

        // Доля отмен — событийная: отменённые сделки / (оплаченные + отменённые).
        var cancellationRate = lossRates.CancellationRate(totals.CancelledCount, totals.PaidCount);

        // То же для предыдущего периода — база Δ.
        var previousCancellationRate = lossRates.CancellationRate(previousTotals.CancelledCount, previousTotals.PaidCount);

        // Топы и хвосты двух разрезов: возвраты по товарам, отмены по менеджерам.
        var (refundTop, refundTail) = BuildTop(refundedByProduct);
        var (cancellationTop, cancellationTail) = BuildTop(cancelledByManager);

        // Блок 10: сумма, доля, Δ в п.п., дневной ряд, топ и хвост возвратов.
        var refunds = new RefundsModel(
            totals.RefundedAmount,
            refundRate,
            deltas.PointsDelta(refundRate, previousRefundRate),
            ContinuousSeries(query.Period, refundedDaily),
            refundTop,
            refundTail);

        // Блок 11: та же структура для отмен.
        var cancellations = new CancellationsModel(
            totals.CancelledAmount,
            cancellationRate,
            deltas.PointsDelta(cancellationRate, previousCancellationRate),
            ContinuousSeries(query.Period, cancelledDaily),
            cancellationTop,
            cancellationTail);

        return (refunds, cancellations);
    }

    /// <summary>
    /// Ранжирует объекты потерь по отнесённой сумме и замыкает список хвостом
    /// «Остальные N», чтобы доли топа плюс хвост давали 100% группы
    /// (domain.md, «Топы блока потерь»).
    /// </summary>
    private (IReadOnlyList<LossItemModel> Top, LossTailModel? Tail) BuildTop(
        IReadOnlyList<LossAggregateRow> rows)
    {
        // Пустой набор потерь: нет ни топа, ни хвоста.
        if (rows.Count == 0)
            return (Array.Empty<LossItemModel>(), null);

        // Общая сумма потерь группы — знаменатель для долей.
        var total = rows.Sum(r => r.Amount);

        // Ранжируем объекты потерь по отнесённой сумме (по убыванию).
        var ordered = ranking.OrderByMetricDescending(rows, r => r.Amount, revenueTieBreak: null, name: r => r.Name);

        // Максимум суммы — эталон длины баров топа.
        var groupMax = ordered[0].Amount;

        // Топ-N объектов: доля от общей суммы (сегмент бублика) и длина бара.
        var top = ordered.Take(TopN).Select(r => new LossItemModel(
            r.Id, r.Name, r.Category,
            r.Amount,
            total != 0 ? r.Amount / total * 100 : 0m,
            contributions.BarLength(r.Amount, groupMax))).ToList();

        // Строки за пределами топа — кандидаты в хвост.
        var tailRows = ordered.Skip(TopN).ToList();

        LossTailModel? tail = null;

        // Хвост агрегируется одной строкой: топ + хвост покрывают 100% группы,
        // поэтому «потерянные» строки не искажают картину потерь.
        if (tailRows.Count > 0)
        {
            // Сумма хвоста и число объектов в нём — одна строка «Остальные N».
            var tailAmount = tailRows.Sum(r => r.Amount);

            tail = new LossTailModel(
                tailRows.Count,
                tailAmount,
                total != 0 ? tailAmount / total * 100 : 0m);
        }

        return (top, tail);
    }

    private static IReadOnlyList<SeriesPointModel> ContinuousSeries(
        DateRange period,
        IReadOnlyList<LossDailyRow> daily)
    {
        // Индекс «день → сумма потерь» для быстрого подстановления значения в точку серии.
        var byDay = daily.GroupBy(d => d.Date.Date).ToDictionary(g => g.Key, g => g.Sum(x => x.Amount));

        // Дни без потерь несут настоящий ноль — линии возвратов/отмен непрерывны
        // по всему периоду (api.md, блоки 10–11).
        var result = BuilderCommon
            .DaysOf(period)
            .Select(day => new SeriesPointModel(day, byDay.TryGetValue(day, out var value) ? value : 0m))
            .ToList();

        return result;
    }

    private const int TopN = BuilderCommon.TopN;
}
