namespace SalesDashboard.Application.Abstractions.Queries;

/// <summary>
/// Источник блока KPI (backend.md §4.3): итоги периода и дневная серия за
/// спарклайнами. Только суммы и количества — отношения и Δ относятся к домену.
/// </summary>
public interface IKpiReadPort
{
    Task<PeriodTotalsRow> ReadTotalsAsync(ReadFilter filter, CancellationToken cancellationToken);

    Task<IReadOnlyList<DailyAggregateRow>> ReadDailyAsync(ReadFilter filter, CancellationToken cancellationToken);
}
