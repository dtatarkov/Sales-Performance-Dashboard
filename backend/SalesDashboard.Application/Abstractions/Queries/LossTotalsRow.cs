namespace SalesDashboard.Application.Abstractions.Queries;

/// <summary>
/// Всё, что нужно двум блокам потерь за одно окно: событийные суммы по
/// <c>refundedAt</c>/<c>cancelledAt</c> плюс количества оплаченной когорты за
/// когортной долей возвратов и событийной долей отмен (domain.md, «Когорта и
/// событие»).
/// </summary>
public sealed record LossTotalsRow(
    decimal RefundedAmount,
    decimal CancelledAmount,
    int PaidCount,
    int CohortRefundedCount,
    int CancelledCount);
