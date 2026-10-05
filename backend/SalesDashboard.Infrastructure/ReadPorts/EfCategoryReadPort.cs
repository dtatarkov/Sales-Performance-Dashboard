using Microsoft.EntityFrameworkCore;
using SalesDashboard.Application.Abstractions.Queries;
using SalesDashboard.Infrastructure.Extensions;
using SalesDashboard.Infrastructure.Persistence;

namespace SalesDashboard.Infrastructure.ReadPorts;

/// <summary>Источник данных по категориям (backend.md §5.3): агрегаты оплачиваемой когорты по категориям.</summary>
public sealed class EfCategoryReadPort(SalesDbContext db) : ICategoryReadPort
{
    public async Task<IReadOnlyList<CategoryAggregateRow>> ReadAggregatesAsync(ReadFilter filter, CancellationToken cancellationToken)
    {
        // Оплаченная когорта периода (полуоткрытое окно paid_at + фильтр сегмента).
        var paid = db.Sales.AsNoTracking().InPaidCohort(filter);

        // Развёртка до позиций: категория через навигацию товара, Id/RefundedAt — для distinct-счётчиков.
        var itemRows = from s in paid
                       from i in s.Items
                       select new
                       {
                           s.Id,
                           s.RefundedAt,
                           i.Product.CategoryId,
                           Category = i.Product.Category.Name,
                           i.Quantity,
                           i.SalePrice,
                           i.UnitCost,
                       };

        // Группируем позиции по категории: ключ — (CategoryId, Name).
        // Для каждой группы считаем:
        //  - Revenue: SUM(SalePrice × Quantity), только невозвращённые позиции.
        //  - Cost: SUM(UnitCost × Quantity), только невозвращённые позиции.
        //  - SalesCount: DISTINCT число сделок (JOIN с Items размножает строки).
        // ?? 0m защищает от NULL при пустой группе.
        var aggregates = await itemRows
            .GroupBy(x => new { x.CategoryId, x.Category })
            .Select(g => new
            {
                g.Key.CategoryId,
                g.Key.Category,
                Revenue = g.Where(x => x.RefundedAt == null).Sum(x => (decimal?)(x.SalePrice * x.Quantity)) ?? 0m,
                Cost = g.Where(x => x.RefundedAt == null).Sum(x => (decimal?)(x.UnitCost * x.Quantity)) ?? 0m,
                SalesCount = g.Select(x => x.Id).Distinct().Count(),
            })
            .ToListAsync(cancellationToken);

        // Проецируем анонимные строки в типизированные CategoryAggregateRow.
        var categoryRows = aggregates
            .Select(a => new CategoryAggregateRow(
                a.CategoryId,
                a.Category,
                a.Revenue,
                a.Cost,
                a.SalesCount))
            .ToList();

        // Возвращаем список агрегатов по категориям.
        return categoryRows;
    }
}
