namespace SalesDashboard.Application.Abstractions.Queries;

/// <summary>Один бакет сетки серий событийного ряда потерь (возвраты по
/// <c>refundedAt</c>, отмены по <c>cancelledAt</c>).</summary>
public sealed record LossDailyRow(
    DateTime Date,
    decimal Amount);
