namespace SalesDashboard.Application.Abstractions.Queries;

/// <summary>
/// Источник блоков товаров: агрегаты оплаченной когорты по каждому товару.
/// </summary>
public interface IProductReadPort
{
    Task<IReadOnlyList<ProductAggregateRow>> ReadAggregatesAsync(ReadFilter filter, CancellationToken cancellationToken);
}
