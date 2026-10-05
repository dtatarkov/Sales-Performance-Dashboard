namespace SalesDashboard.Application.Abstractions.Queries;

/// <summary>Один день событийной серии потерь (возвраты по <c>refundedAt</c>,
/// отмены по <c>cancelledAt</c>).</summary>
public sealed record LossDailyRow(
    DateTime Date,
    decimal Amount);
