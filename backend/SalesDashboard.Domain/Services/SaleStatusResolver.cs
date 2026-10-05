namespace SalesDashboard.Domain;

/// <summary>
/// Выводит статус продажи из её дат событий — единый источник истины
/// для матрицы статусов (domain.md, «Жизненный цикл сделки»).
/// </summary>
public interface ISaleStatusResolver
{
    /// <summary>
    /// Возвращает вычисленный статус или <c>null</c>, когда ни одно событие ещё
    /// не разрешило продажу (все даты отсутствуют).
    /// </summary>
    SaleStatus? Resolve(DateTime? paidAt, DateTime? refundedAt, DateTime? cancelledAt);
}

/// <summary>
/// Не имеющая состояния реализация <see cref="ISaleStatusResolver"/>.
/// Приоритет: Cancelled → Refunded → Paid.
/// </summary>
public sealed class SaleStatusResolver : ISaleStatusResolver
{
    public SaleStatus? Resolve(DateTime? paidAt, DateTime? refundedAt, DateTime? cancelledAt)
        => (paidAt, refundedAt, cancelledAt) switch
        {
            (_, _, not null) => SaleStatus.Cancelled,
            (not null, not null, null) => SaleStatus.Refunded,
            (not null, null, null) => SaleStatus.Paid,
            _ => null,
        };
}
