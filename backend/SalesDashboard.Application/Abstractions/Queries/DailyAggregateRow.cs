namespace SalesDashboard.Application.Abstractions.Queries;

/// <summary>
/// Один бакет сетки серий (<see cref="SeriesBuckets"/>) по оплаченной когорте —
/// питает спарклайны KPI и блок временных рядов.
/// </summary>
/// <param name="Date">Начало бакета в UTC (день или час от начала периода).</param>
public sealed record DailyAggregateRow(
    DateTime Date,
    decimal Revenue,
    decimal Cost,
    int PaidCount);
