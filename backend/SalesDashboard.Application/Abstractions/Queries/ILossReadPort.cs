namespace SalesDashboard.Application.Abstractions.Queries;

/// <summary>
/// Источник блоков потерь (backend.md §4.3): событийные суммы возвратов и отмен,
/// дневные серии и топы (возвраты — товары, отмены — менеджеры).
/// </summary>
public interface ILossReadPort
{
    Task<LossTotalsRow> ReadTotalsAsync(ReadFilter filter, CancellationToken cancellationToken);

    Task<IReadOnlyList<LossDailyRow>> ReadRefundedDailyAsync(ReadFilter filter, CancellationToken cancellationToken);

    Task<IReadOnlyList<LossDailyRow>> ReadCancelledDailyAsync(ReadFilter filter, CancellationToken cancellationToken);

    /// <summary>Возвращённая сумма с группировкой по товару (топ блока возвратов).</summary>
    Task<IReadOnlyList<LossAggregateRow>> ReadRefundedByProductAsync(ReadFilter filter, CancellationToken cancellationToken);

    /// <summary>Сумма отмен с группировкой по менеджеру (топ блока отмен).</summary>
    Task<IReadOnlyList<LossAggregateRow>> ReadCancelledByManagerAsync(ReadFilter filter, CancellationToken cancellationToken);
}
