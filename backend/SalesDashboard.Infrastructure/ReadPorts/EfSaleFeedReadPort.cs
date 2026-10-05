using Microsoft.EntityFrameworkCore;
using SalesDashboard.Application.Abstractions.Queries;
using SalesDashboard.Infrastructure.Extensions;
using SalesDashboard.Infrastructure.Persistence;

namespace SalesDashboard.Infrastructure.ReadPorts;

/// <summary>
/// Источник ленты последних продаж (backend.md §5.3). Единственный порт, чей SQL
/// сортирует и ограничивает выборку: сначала самые свежие оплаченные сделки,
/// обратный скан по <c>ix_sales_paid_at</c> (db.md).
/// </summary>
public sealed class EfSaleFeedReadPort(SalesDbContext db) : ISaleFeedReadPort
{
    public async Task<IReadOnlyList<SaleFeedRow>> ReadRecentAsync(
        ReadFilter filter,
        int limit,
        CancellationToken cancellationToken)
    {
        var rows = await db.Sales.AsNoTracking()
            .InPaidCohort(filter)
            .OrderByDescending(s => s.PaidAt)
            .Take(limit)
            .Select(s => new SaleFeedRow(
                s.Id,
                s.Customer.Name,
                s.Manager.Name,
                s.PaidAt!.Value,
                s.RefundedAt,
                s.CancelledAt,
                s.Items.Count,
                s.Items.Sum(i => (decimal?)(i.SalePrice * i.Quantity)) ?? 0m,
                s.Items.Sum(i => (decimal?)(i.UnitCost * i.Quantity)) ?? 0m))
            .ToListAsync(cancellationToken);

        return rows;
    }
}
