namespace SalesDashboard.Application.Abstractions.Queries;

/// <summary>Сырые агрегаты по категориям за оплаченную когорту одного периода.</summary>
public sealed record CategoryAggregateRow(
    Guid Id,
    string Name,
    decimal Revenue,
    decimal Cost,
    int SalesCount);
