using SalesDashboard.Domain;

namespace SalesDashboard.Domain.Tests;

/// <summary>
/// Доли потерь (domain.md, «Refund Rate (cohort)» / «Cancellation Rate (event)»).
/// Знаменатели различаются намеренно: возвраты считаются когортно,
/// отмены — по событиям.
/// </summary>
public class LossRateCalculatorTests
{
    private readonly LossRateCalculator _rates = new();

    /// <summary>Refund Rate — доля возвратов от оплаченной когорты (1 из 20 = 5%).</summary>
    [Fact]
    public void RefundRate_IsRefundedOverPaidCohort()
        => Assert.Equal(5m, _rates.RefundRate(refundedCount: 1, paidCount: 20));

    /// <summary>Пустая оплаченная когорта → не определено, а не 0%.</summary>
    [Fact]
    public void RefundRate_EmptyCohort_ReturnsNull()
        => Assert.Null(_rates.RefundRate(refundedCount: 0, paidCount: 0));

    /// <summary>Все сделки когорты возвращены → 100%.</summary>
    [Fact]
    public void RefundRate_FullRefund_IsOneHundred()
        => Assert.Equal(100m, _rates.RefundRate(refundedCount: 3, paidCount: 3));

    /// <summary>Refund Rate может превышать 100%: возвраты приходят по refundedAt для сделок, оплаченных в более раннем окне.</summary>
    [Fact]
    public void RefundRate_CanExceedOneHundred_ForCrossWindowRefunds()
        => Assert.Equal(200m, _rates.RefundRate(refundedCount: 2, paidCount: 1));

    /// <summary>Cancellation Rate — доля отменённых среди разрешившихся сделок (1 из 5 = 20%).</summary>
    [Fact]
    public void CancellationRate_IsCancelledOverPaidPlusCancelled()
        => Assert.Equal(20m, _rates.CancellationRate(cancelledCount: 1, paidCount: 4));

    /// <summary>В периоде нет разрешившихся сделок → «—» (domain.md edge case «В периоде нет разрешившихся сделок»).</summary>
    [Fact]
    public void CancellationRate_NothingResolved_ReturnsNull()
        => Assert.Null(_rates.CancellationRate(cancelledCount: 0, paidCount: 0));

    /// <summary>Все разрешившиеся сделки отменены → 100%.</summary>
    [Fact]
    public void CancellationRate_OnlyCancellations_IsOneHundred()
        => Assert.Equal(100m, _rates.CancellationRate(cancelledCount: 3, paidCount: 0));

    /// <summary>Отмен нет, но знаменатель не пуст → корректный 0%, а не «—».</summary>
    [Fact]
    public void CancellationRate_NoCancellations_IsZero()
        => Assert.Equal(0m, _rates.CancellationRate(cancelledCount: 0, paidCount: 7));
}
