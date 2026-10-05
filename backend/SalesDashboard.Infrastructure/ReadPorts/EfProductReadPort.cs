using Microsoft.EntityFrameworkCore;
using SalesDashboard.Application.Abstractions.Queries;
using SalesDashboard.Infrastructure.Extensions;
using SalesDashboard.Infrastructure.Persistence;

namespace SalesDashboard.Infrastructure.ReadPorts;

/// <summary>
/// Источник данных по товарам (backend.md §5.3). Знаменатель доли возвратов
/// считает сделку один раз, даже если товар встречается в ней несколько раз
/// (domain.md, «Товар в одной продаже несколько раз») — отсюда distinct-счётчики.
/// </summary>
public sealed class EfProductReadPort(SalesDbContext db) : IProductReadPort
{
    public async Task<IReadOnlyList<ProductAggregateRow>> ReadAggregatesAsync(ReadFilter filter, CancellationToken cancellationToken)
    {
        // Оплаченная когорта периода (полуоткрытое окно paid_at + фильтр сегмента).
        var paid = db.Sales.AsNoTracking().InPaidCohort(filter);

        // Развёртка до позиций: атрибуты товара и категории через навигации,
        // Id/RefundedAt — для distinct-счётчиков сделок.
        var itemRows = from s in paid
                       from i in s.Items
                       select new
                       {
                           s.Id,
                           s.RefundedAt,
                           i.ProductId,
                           i.Product.Name,
                           i.Product.Sku,
                           Category = i.Product.Category.Name,
                           i.Quantity,
                           i.SalePrice,
                           i.UnitCost,
                       };

        // Группируем позиции по товару: ключ — (ProductId, Name, Sku, Category).
        // Для каждой группы считаем:
        //  - Revenue: SUM(SalePrice × Quantity), только невозвращённые позиции.
        //  - Cost: SUM(UnitCost × Quantity), только невозвращённые позиции.
        //  - Units: SUM(Quantity), только невозвращённые позиции.
        //  - PaidCount: DISTINCT число оплаченных сделок.
        //  - RefundedCount: DISTINCT число возвращённых сделок.
        // ?? 0m/0 — защита от NULL при пустой группе.
        var aggregates = await itemRows
            .GroupBy(x => new { x.ProductId, x.Name, x.Sku, x.Category })
            .Select(g => new
            {
                g.Key.ProductId,
                g.Key.Name,
                g.Key.Sku,
                g.Key.Category,
                Revenue = g.Where(x => x.RefundedAt == null).Sum(x => (decimal?)(x.SalePrice * x.Quantity)) ?? 0m,
                Cost = g.Where(x => x.RefundedAt == null).Sum(x => (decimal?)(x.UnitCost * x.Quantity)) ?? 0m,
                Units = g.Where(x => x.RefundedAt == null).Sum(x => (int?)x.Quantity) ?? 0,
                PaidCount = g.Select(x => x.Id).Distinct().Count(),
                RefundedCount = g.Where(x => x.RefundedAt != null).Select(x => x.Id).Distinct().Count(),
            })
            .ToListAsync(cancellationToken);

        // Проецируем анонимные строки в типизированные ProductAggregateRow.
        var productRows = aggregates
            .Select(a => new ProductAggregateRow(
                a.ProductId,
                a.Name,
                a.Sku,
                a.Category,
                a.Revenue,
                a.Cost,
                a.Units,
                a.PaidCount,
                a.RefundedCount))
            .ToList();

        // Возвращаем список агрегатов по товарам.
        return productRows;
    }
}
