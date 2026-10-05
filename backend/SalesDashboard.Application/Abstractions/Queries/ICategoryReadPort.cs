namespace SalesDashboard.Application.Abstractions.Queries;

/// <summary>Источник блоков категорий: агрегаты оплаченной когорты по каждой категории.</summary>
public interface ICategoryReadPort
{
    Task<IReadOnlyList<CategoryAggregateRow>> ReadAggregatesAsync(ReadFilter filter, CancellationToken cancellationToken);
}
