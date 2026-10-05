namespace SalesDashboard.Application.Abstractions.Queries;

/// <summary>
/// Один день оплаченной когорты — питает спарклайны KPI и блок временных рядов.
/// </summary>
/// <param name="Date">Начало дня в UTC.</param>
public sealed record DailyAggregateRow(
    DateTime Date,
    decimal Revenue,
    decimal Cost,
    int PaidCount);
