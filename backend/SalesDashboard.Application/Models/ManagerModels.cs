namespace SalesDashboard.Application.Models;

/// <summary>
/// Рейтинг менеджеров (api.md, блок 2). Два набора данных — валовая прибыль и
/// средний чек — каждый несёт те же строки, ранжированные по своей метрике.
/// </summary>
public sealed record ManagerRatingModel(IReadOnlyList<DatasetModel<ManagerRatingItemModel>> Datasets);

/// <summary>
/// Одна строка менеджера в рейтинге (api.md, <c>ManagerRatingItemModel</c>).
/// Менеджер без продаж присутствует с нулями, а не скрыт
/// (domain.md, «Менеджер без продаж»).
/// </summary>
/// <param name="Margin">Процент; <c>null</c> при нулевой выручке.</param>
/// <param name="CancellationRate">Процент; <c>null</c> ниже <c>Cancellation Min Sample</c>.</param>
/// <param name="Contribution">Вычисляется относительно метрики активного набора — доля общей ВП или кратность среднему чеку группы.</param>
public sealed record ManagerRatingItemModel(
    Guid Id,
    string Name,
    string? Avatar,
    string Initials,
    string Team,
    int SalesCount,
    decimal Revenue,
    DeltaModel? RevenueDelta,
    decimal GrossProfit,
    DeltaModel? GrossProfitDelta,
    decimal AverageCheck,
    DeltaModel? AverageCheckDelta,
    decimal? Margin,
    DeltaModel? MarginDelta,
    decimal? CancellationRate,
    DeltaModel? CancellationRateDelta,
    ContributionModel Contribution);

/// <summary>
/// График сравнения менеджеров (api.md, блок 3). Каждый набор берёт свой
/// топ-10 по своей метрике, поэтому и состав, и порядок меняются при переключении.
/// </summary>
public sealed record ManagerComparisonModel(
    IReadOnlyList<DatasetModel<ManagerComparisonItemModel>> Datasets);

/// <summary>
/// Один бар графика сравнения (api.md, <c>ManagerComparisonItemModel</c>).
/// </summary>
/// <param name="Value">Метрика активного набора — валовая прибыль или средний чек.</param>
public sealed record ManagerComparisonItemModel(
    Guid Id,
    string Name,
    decimal Value,
    DeltaModel? Delta);
