using SalesDashboard.Domain;

namespace SalesDashboard.Domain.Tests;

/// <summary>
/// Статус выводится из дат, нигде не хранится (domain.md, «Жизненный цикл
/// сделки»). Резолвер — единственный источник истины по матрице дат, поэтому
/// каждая комбинация таблицы спецификации зафиксирована здесь.
/// </summary>
public class SaleStatusResolverTests
{
    private static readonly DateTime Paid = new(2024, 9, 10, 12, 0, 0, DateTimeKind.Utc);
    private static readonly DateTime Refunded = new(2024, 9, 20, 12, 0, 0, DateTimeKind.Utc);
    private static readonly DateTime Cancelled = new(2024, 9, 15, 12, 0, 0, DateTimeKind.Utc);

    private readonly SaleStatusResolver _resolver = new();

    // Таблица спецификации: Оплачена — paidAt, без возврата, без отмены.
    [Fact]
    public void Resolve_PaidOnly_ReturnsPaid()
        => Assert.Equal(SaleStatus.Paid, _resolver.Resolve(Paid, null, null));

    // Таблица спецификации: Возвращена — paidAt + refundedAt.
    [Fact]
    public void Resolve_PaidThenRefunded_ReturnsRefunded()
        => Assert.Equal(SaleStatus.Refunded, _resolver.Resolve(Paid, Refunded, null));

    // Таблица спецификации: Отменена — без paidAt, cancelledAt задан.
    [Fact]
    public void Resolve_CancelledWithoutPayment_ReturnsCancelled()
        => Assert.Equal(SaleStatus.Cancelled, _resolver.Resolve(null, null, Cancelled));

    /// <summary>
    /// Сделка без разрешившегося события — не оплачена, не возвращена и не отменена.
    /// Такие строки не должны попадать ни в один знаменатель метрик, поэтому
    /// «статуса нет» отличается от каждого из трёх статусов.
    /// </summary>
    [Fact]
    public void Resolve_NoDates_ReturnsNull()
        => Assert.Null(_resolver.Resolve(null, null, null));

    /// <summary>
    /// Отмена сильнее возврата: отмена — более тяжёлая потеря и не должна
    /// прятаться за следом возврата в той же строке.
    /// </summary>
    [Fact]
    public void Resolve_CancelledOutranksRefund()
        => Assert.Equal(SaleStatus.Cancelled, _resolver.Resolve(Paid, Refunded, Cancelled));

    /// <summary>Отмена сильнее и простого платежа.</summary>
    [Fact]
    public void Resolve_CancelledOutranksPaid()
        => Assert.Equal(SaleStatus.Cancelled, _resolver.Resolve(Paid, null, Cancelled));

    /// <summary>
    /// След возврата без платежа нарушает инвариант дат
    /// (<c>createdAt ≤ paidAt ≤ refundedAt</c>, domain.md), поэтому резолвер
    /// отказывается выдумывать статус, а не угадывает. Seed такие строки не
    /// порождает; ветка — защита от плохого импорта.
    /// </summary>
    [Fact]
    public void Resolve_RefundWithoutPayment_ReturnsNull()
        => Assert.Null(_resolver.Resolve(null, Refunded, null));

    /// <summary>Без состояния: повторные вызовы с равным входом дают равный результат.</summary>
    [Fact]
    public void Resolve_IsDeterministic()
        => Assert.Equal(
            _resolver.Resolve(Paid, Refunded, null),
            _resolver.Resolve(Paid, Refunded, null));
}
