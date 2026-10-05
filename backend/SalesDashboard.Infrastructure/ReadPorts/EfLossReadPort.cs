using Microsoft.EntityFrameworkCore;
using SalesDashboard.Application.Abstractions.Queries;
using SalesDashboard.Infrastructure.Extensions;
using SalesDashboard.Infrastructure.Persistence;

namespace SalesDashboard.Infrastructure.ReadPorts;

/// <summary>
/// Источник данных по потерям (backend.md §5.3): суммы возвратов и отмен по дате
/// события, дневные ряды и топы. Возвраты режутся по товарам, отмены — по
/// менеджерам (domain.md, «Ответственность»). Счётчики когорт за двумя долями
/// берутся из оплачиваемой когорты и окна событий соответственно.
/// </summary>
public sealed class EfLossReadPort(SalesDbContext db) : ILossReadPort
{
    public async Task<LossTotalsRow> ReadTotalsAsync(ReadFilter filter, CancellationToken cancellationToken)
    {
        // Окно возвратов за период.
        var refundedSales = db.Sales.AsNoTracking().InRefundedWindow(filter);
        // Окно отмен за период.
        var cancelledSales = db.Sales.AsNoTracking().InCancelledWindow(filter);
        // Оплаченная когорта — база для сравнения.
        var paidSales = db.Sales.AsNoTracking().InPaidCohort(filter);

        // Сумма потерь по возвратам: разворачиваем позиции, считаем SalePrice × Quantity.
        var refundedAmount = await refundedSales
            .SelectMany(s => s.Items)
            .SumAsync(i => (decimal?)(i.SalePrice * i.Quantity), cancellationToken) ?? 0m;

        // Сумма потерь по отменам: аналогично возвратам.
        var cancelledAmount = await cancelledSales
            .SelectMany(s => s.Items)
            .SumAsync(i => (decimal?)(i.SalePrice * i.Quantity), cancellationToken) ?? 0m;

        // Количество продаж в оплаченной когорте — база для сравнения.
        var paidCount = await paidSales.CountAsync(cancellationToken);

        // Знаменатель доли возвратов — оплаченная когорта, счётчик возвратов
        // внутри неё (сделка может быть и оплачена, и возвращена).
        var cohortRefundedCount = await paidSales.CountAsync(s => s.RefundedAt != null, cancellationToken);

        // Знаменатель доли отмен — всё окно отмен, включая сделки без payment.
        var cancelledCount = await cancelledSales.CountAsync(cancellationToken);

        return new LossTotalsRow(refundedAmount, cancelledAmount, paidCount, cohortRefundedCount, cancelledCount);
    }

    public async Task<IReadOnlyList<LossDailyRow>> ReadRefundedDailyAsync(ReadFilter filter, CancellationToken cancellationToken)
    {
        // Окно возвратов за период.
        var refunded = db.Sales.AsNoTracking().InRefundedWindow(filter);

        // Разворачиваем продажи в позиции и группируем по дате возврата.
        var rows = await (from s in refunded
                          from i in s.Items
                          select new
                          {
                              // День возврата (без времени) — ключ группировки.
                              Date = s.RefundedAt!.Value.Date,
                              // Сумма возврата позиции: SalePrice × Quantity.
                              Amount = (decimal?)(i.SalePrice * i.Quantity),
                          })
            .GroupBy(x => x.Date)
            .Select(g => new { Date = g.Key, Amount = g.Sum(x => x.Amount) ?? 0m })
            .ToListAsync(cancellationToken);

        // Проекция в итоговые строки.
        var dailyRows = rows
            .OrderBy(r => r.Date)
            .Select(r => new LossDailyRow(r.Date, r.Amount))
            .ToList();

        return dailyRows;
    }

    public async Task<IReadOnlyList<LossDailyRow>> ReadCancelledDailyAsync(ReadFilter filter, CancellationToken cancellationToken)
    {
        // Окно отмен за период.
        var cancelled = db.Sales.AsNoTracking().InCancelledWindow(filter);

        // Разворачиваем продажи в позиции и группируем по дате отмены.
        var rows = await (from s in cancelled
                          from i in s.Items
                          select new
                          {
                              // День отмены (без времени) — ключ группировки.
                              Date = s.CancelledAt!.Value.Date,
                              // Сумма отмены позиции: SalePrice × Quantity.
                              Amount = (decimal?)(i.SalePrice * i.Quantity),
                          })
            .GroupBy(x => x.Date)
            .Select(g => new { Date = g.Key, Amount = g.Sum(x => x.Amount) ?? 0m })
            .ToListAsync(cancellationToken);

        // Проекция в итоговые строки.
        var dailyRows = rows
            .OrderBy(r => r.Date)
            .Select(r => new LossDailyRow(r.Date, r.Amount))
            .ToList();

        return dailyRows;
    }

    public async Task<IReadOnlyList<LossAggregateRow>> ReadRefundedByProductAsync(ReadFilter filter, CancellationToken cancellationToken)
    {
        // Окно возвратов с фильтром.
        var refunded = db.Sales.AsNoTracking().InRefundedWindow(filter);

        // Разворачиваем продажи в позиции и группируем по товару и категории.
        var rows = await (from s in refunded
                          from i in s.Items
                          select new
                          {
                              // Идентификатор товара — ключ группировки.
                              i.ProductId,
                              // Название товара.
                              i.Product.Name,
                              // Категория товара.
                              Category = i.Product.Category.Name,
                              // Сумма возврата позиции: SalePrice × Quantity.
                              Amount = (decimal?)(i.SalePrice * i.Quantity),
                          })
            .GroupBy(x => new { x.ProductId, x.Name, x.Category })
            .Select(g => new
            {
                // Ключ группировки.
                g.Key.ProductId,
                g.Key.Name,
                g.Key.Category,
                // Сумма потерь по товару.
                Amount = g.Sum(x => x.Amount) ?? 0m,
            })
            .ToListAsync(cancellationToken);

        // Проекция в итоговые строки.
        var productRows = rows
            .Select(r => new LossAggregateRow(r.ProductId, r.Name, r.Category, r.Amount))
            .ToList();

        return productRows;
    }

    public async Task<IReadOnlyList<LossAggregateRow>> ReadCancelledByManagerAsync(ReadFilter filter, CancellationToken cancellationToken)
    {
        // Окно отмен с фильтром.
        var cancelled = db.Sales.AsNoTracking().InCancelledWindow(filter);

        // Разворачиваем продажи в позиции и группируем по менеджеру.
        var rows = await (from s in cancelled
                          from i in s.Items
                          select new
                          {
                              // Идентификатор менеджера — ключ группировки.
                              s.ManagerId,
                              // Название менеджера.
                              s.Manager.Name,
                              // Сумма отмены позиции: SalePrice × Quantity.
                              Amount = (decimal?)(i.SalePrice * i.Quantity),
                          })
            .GroupBy(x => new { x.ManagerId, x.Name })
            .Select(g => new
            {
                // Ключ группировки.
                g.Key.ManagerId,
                g.Key.Name,
                // Сумма потерь по менеджеру.
                Amount = g.Sum(x => x.Amount) ?? 0m,
            })
            .ToListAsync(cancellationToken);

        // Проекция в итоговые строки.
        var managerRows = rows
            .Select(r => new LossAggregateRow(r.ManagerId, r.Name, null, r.Amount))
            .ToList();

        return managerRows;
    }
}
