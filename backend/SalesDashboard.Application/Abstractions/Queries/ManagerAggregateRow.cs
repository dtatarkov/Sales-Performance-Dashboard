namespace SalesDashboard.Application.Abstractions.Queries;

/// <summary>Сырые агрегаты по менеджерам за один период, ключ — id менеджера.</summary>
public sealed record ManagerAggregateRow(
    Guid Id,
    decimal Revenue,
    decimal Cost,
    int PaidCount,
    int RefundedCount,
    int CancelledCount);
