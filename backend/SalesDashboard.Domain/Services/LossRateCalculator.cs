namespace SalesDashboard.Domain;

/// <summary>
/// Доли возвратов и отмен с доменными правилами «null когда пусто»
/// (domain.md, «Refund rate (cohort)» / «Cancellation rate (event)»).
/// </summary>
public interface ILossRateCalculator
{
    /// <summary>
    /// Доля возвратов: продажи, возвращённые в окне когорты ÷ продажи, оплаченные в окне, процент.
    /// <c>null</c>, когда оплаченная когорта пуста.
    /// </summary>
    decimal? RefundRate(int refundedCount, int paidCount);

    /// <summary>
    /// Доля отмен: отмены по дате события ÷ (оплаченные + отменённые по дате события), процент.
    /// <c>null</c>, когда обе части знаменателя пусты.
    /// </summary>
    decimal? CancellationRate(int cancelledCount, int paidCount);
}

/// <summary>Не имеющая состояния реализация <see cref="ILossRateCalculator"/>.</summary>
public sealed class LossRateCalculator : ILossRateCalculator
{
    public decimal? RefundRate(int refundedCount, int paidCount)
        => paidCount > 0
            ? (decimal)refundedCount / paidCount * 100
            : null;

    public decimal? CancellationRate(int cancelledCount, int paidCount)
    {
        var total = cancelledCount + paidCount;
        return total > 0
            ? (decimal)cancelledCount / total * 100
            : null;
    }
}
