namespace SalesDashboard.Application.Abstractions.Queries;

/// <summary>
/// Одна сделка ленты последних продаж с её сырыми датами событий — статус
/// выводит доменный резолвер, никогда не читается из хранилища.
/// </summary>
/// <param name="Revenue">Полная сумма сделки (сумма позиций), независимо от последующего возврата.</param>
public sealed record SaleFeedRow(
    Guid Id,
    string Client,
    string Manager,
    DateTime PaidAt,
    DateTime? RefundedAt,
    DateTime? CancelledAt,
    int ItemsCount,
    decimal Revenue,
    decimal Cost);
