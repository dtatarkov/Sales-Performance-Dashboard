namespace SalesDashboard.Application.Abstractions.Queries;

/// <summary>
/// Источник блоков клиентов: агрегаты оплаченной когорты по каждому клиенту за
/// любой период (топ-10 и динамика сравнивают текущий период с предыдущим).
/// </summary>
public interface ICustomerReadPort
{
    Task<IReadOnlyList<CustomerAggregateRow>> ReadAggregatesAsync(ReadFilter filter, CancellationToken cancellationToken);
}
