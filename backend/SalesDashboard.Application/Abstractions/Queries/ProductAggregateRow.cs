namespace SalesDashboard.Application.Abstractions.Queries;

/// <summary>
/// Сырые агрегаты по товарам за один период.
/// </summary>
/// <param name="PaidCount">Различные оплаченные продажи, содержащие товар — знаменатель доли
/// возвратов считает продажу один раз, даже если товар встречается в ней несколько раз (domain.md).</param>
public sealed record ProductAggregateRow(
    Guid Id,
    string Name,
    string Sku,
    string Category,
    decimal Revenue,
    decimal Cost,
    int Units,
    int PaidCount,
    int RefundedCount);
