namespace SalesDashboard.Application.Abstractions.Queries;

/// <summary>
/// Источник блоков менеджеров: реестр плюс агрегаты оплаченной когорты по
/// каждому менеджеру за любой период, и дневная серия выручки одного менеджера.
/// </summary>
public interface IManagerReadPort
{
    /// <summary>Все менеджеры (реестр) — рейтинг включает менеджеров без продаж.</summary>
    Task<IReadOnlyList<ManagerRosterRow>> ReadRosterAsync(CancellationToken cancellationToken);

    /// <summary>
    /// Агрегаты оплаченной когорты с группировкой по менеджеру за <see cref="ReadFilter.Period"/>
    /// (число отмен считается по <c>cancelledAt</c> в том же окне). Менеджеры без
    /// продаж в окне отсутствуют — билдер доjoinивает их на реестр.
    /// </summary>
    Task<IReadOnlyList<ManagerAggregateRow>> ReadAggregatesAsync(ReadFilter filter, CancellationToken cancellationToken);

    /// <summary>Дневная серия оплаченной когорты одного менеджера (спарклайн лучшего менеджера).</summary>
    Task<IReadOnlyList<DailyAggregateRow>> ReadDailyByManagerAsync(
        Guid managerId,
        ReadFilter filter,
        CancellationToken cancellationToken);
}
