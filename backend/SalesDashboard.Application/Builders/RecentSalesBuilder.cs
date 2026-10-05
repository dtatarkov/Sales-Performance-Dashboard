using SalesDashboard.Application.Abstractions.Queries;
using SalesDashboard.Application.Models;
using SalesDashboard.Domain;

namespace SalesDashboard.Application.Builders;

/// <summary>Блок 9 (api.md): самые свежие сделки периода.</summary>
public interface IRecentSalesBuilder
{
    Task<RecentSalesModel> BuildAsync(DashboardQuery query, CancellationToken cancellationToken);
}

/// <summary>
/// Преобразует свежие оплаченные сделки в строки ленты. Статус выводится из дат
/// событий — нигде не хранится (domain.md, «Жизненный цикл сделки»). Для
/// возвращённых и отменённых сделок gp равен null: ВП не имеет смысла для
/// потерянных сумм (api.md, SaleFeedItemDto. ВП — null для refunded/cancelled).
/// </summary>
/// <remarks>
/// Edge case: сделка, для которой resolver не смог определить статус, пропускается,
/// а не попадает в ленту с подменённым статусом.
/// </remarks>
public sealed class RecentSalesBuilder(
    ISaleFeedReadPort saleFeedPort,
    ISaleStatusResolver statusResolver) : IRecentSalesBuilder
{
    public async Task<RecentSalesModel> BuildAsync(DashboardQuery query, CancellationToken cancellationToken)
    {
        var rows = await saleFeedPort.ReadRecentAsync(
            new ReadFilter(query.Period, query.Segment),
            BuilderCommon.FeedLimit,
            cancellationToken);

        var sales = rows
            .Select(row =>
            {
                var status = statusResolver.Resolve(row.PaidAt, row.RefundedAt, row.CancelledAt);

                return (Row: row, Status: status);
            })            
            .Where(pair => pair.Status is not null) // Сделка без распознанного статуса не может быть обработана
            .Select(pair =>
            {
                var status = pair.Status!.Value;
                decimal? grossProfit = status == SaleStatus.Paid ? pair.Row.Revenue - pair.Row.Cost : null;

                var model = new SaleFeedItemModel(
                    pair.Row.Id, pair.Row.Client, pair.Row.Manager, pair.Row.PaidAt,
                    pair.Row.ItemsCount, status, pair.Row.Revenue, grossProfit);

                return model;
            })
            .ToList();

        var model = new RecentSalesModel(sales);

        return model;
    }
}
