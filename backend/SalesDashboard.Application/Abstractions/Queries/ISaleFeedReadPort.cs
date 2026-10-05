namespace SalesDashboard.Application.Abstractions.Queries;

/// <summary>
/// Источник ленты последних продаж: новейшие оплаченные сделки периода. Единственный
/// порт, чей SQL сортирует и ограничивает (backend.md §7 — <c>ORDER BY paid_at DESC
/// LIMIT</c>).
/// </summary>
public interface ISaleFeedReadPort
{
    Task<IReadOnlyList<SaleFeedRow>> ReadRecentAsync(
        ReadFilter filter,
        int limit,
        CancellationToken cancellationToken);
}
