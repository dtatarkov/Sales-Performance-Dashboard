namespace SalesDashboard.Application.Abstractions.Queries;

/// <summary>Сырые агрегаты по клиентам за один период, ключ — id клиента.</summary>
public sealed record CustomerAggregateRow(
    Guid Id,
    string Name,
    int Since,
    decimal Revenue,
    decimal Cost,
    int PaidCount,
    int RefundedCount,
    int CancelledCount);
