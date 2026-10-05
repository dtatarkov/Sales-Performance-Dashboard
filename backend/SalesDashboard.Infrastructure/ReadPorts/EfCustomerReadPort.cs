using Microsoft.EntityFrameworkCore;
using SalesDashboard.Application.Abstractions.Queries;
using SalesDashboard.Infrastructure.Extensions;
using SalesDashboard.Infrastructure.Persistence;

namespace SalesDashboard.Infrastructure.ReadPorts;

/// <summary>
/// Источник данных по клиентам (backend.md §5.3): агрегаты оплачиваемой когорты
/// по каждому клиенту; сравнение с предыдущим периодом делает builder.
/// </summary>
public sealed class EfCustomerReadPort(SalesDbContext db) : ICustomerReadPort
{
    public async Task<IReadOnlyList<CustomerAggregateRow>> ReadAggregatesAsync(ReadFilter filter, CancellationToken cancellationToken)
    {
        // Оплаченная когорта периода (полуоткрытое окно paid_at + фильтр сегмента).
        var paid = db.Sales.AsNoTracking().InPaidCohort(filter);

        // Развёртка до позиций: Id/RefundedAt — для distinct-счётчиков сделок.
        var itemRows = from s in paid
                       from i in s.Items
                       select new
                       {
                           s.CustomerId,
                           s.Customer.Name,
                           s.Customer.Since,
                           s.Id,
                           s.RefundedAt,
                           i.Quantity,
                           i.SalePrice,
                           i.UnitCost,
                       };

        // Имя и «с нами с» тянутся в ключ группировки, чтобы вернуть их в row
        // без второго запроса реестра клиентов.
        var paidAggregates = await itemRows
            .GroupBy(x => new { x.CustomerId, x.Name, x.Since })
            .Select(g => new
            {
                // Ключ группировки.
                g.Key.CustomerId,
                g.Key.Name,
                g.Key.Since,
                // Выручка: сумма SalePrice × Quantity по невозвращённым позициям.
                Revenue = g.Where(x => x.RefundedAt == null).Sum(x => (decimal?)(x.SalePrice * x.Quantity)) ?? 0m,
                // Себестоимость: сумма UnitCost × Quantity по невозвращённым позициям.
                Cost = g.Where(x => x.RefundedAt == null).Sum(x => (decimal?)(x.UnitCost * x.Quantity)) ?? 0m,
                // Количество оплаченных сделок клиента: distinct-счётчик Id.
                PaidCount = g.Select(x => x.Id).Distinct().Count(),
                // Количество возвращённых сделок: distinct-счётчик Id с фильтром RefundedAt != null.
                RefundedCount = g.Where(x => x.RefundedAt != null).Select(x => x.Id).Distinct().Count(),
            })
            .ToListAsync(cancellationToken);

        // Отмены — отдельное окно по cancelledAt: неоплаченная отмена не входит
        // в оплаченную когорту (domain.md).
        var cancelledByCustomer = await db.Sales.AsNoTracking()
            .InCancelledWindow(filter)
            .GroupBy(s => s.CustomerId)
            .Select(g => new { CustomerId = g.Key, CancelledCount = g.Count() })
            .ToListAsync(cancellationToken);

        // Справочник отмен по клиентам для быстрого поиска.
        var cancelled = cancelledByCustomer.ToDictionary(c => c.CustomerId);

        // Проекция в итоговые строки: склейка агрегатов и отмен.
        var rows = paidAggregates
            .Select(a => new CustomerAggregateRow(
                a.CustomerId,
                a.Name,
                a.Since,
                a.Revenue,
                a.Cost,
                a.PaidCount,
                a.RefundedCount,
                cancelled.TryGetValue(a.CustomerId, out var cancel) ? cancel.CancelledCount : 0))
            .ToList();

        // Клиенты только с отменами (без оплаченных сделок) в списке не появятся:
        // базой строк служат paidAggregates; такая отмена видна в блоке потерь.
        return rows;
    }
}
