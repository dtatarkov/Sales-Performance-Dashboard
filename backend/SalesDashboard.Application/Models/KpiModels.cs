namespace SalesDashboard.Application.Models;

/// <summary>
/// KPI-карточки плюс лидер периода (api.md, блок 1 <c>KpiDto</c>).
/// Пять карточек отвечают на «как идёт период»; лидер — на «кто это вытянул».
/// Все пять присутствуют всегда — пустой период даёт карточку с null-метриками,
/// но никогда отсутствующую карточку.
/// </summary>
public sealed record KpiModel(
    KpiCardModel Revenue,
    KpiCardModel GrossProfit,
    KpiCardModel Margin,
    KpiCardModel SalesCount,
    KpiCardModel AverageCheck,
    BestManagerModel? BestManager);

/// <summary>
/// Одна KPI-карточка (api.md, <c>KpiCardDto</c>).
/// </summary>
/// <param name="Value">Метрика за период; <c>null</c>, когда не определена (пустой знаменатель, напр. маржа при нулевой выручке).</param>
/// <param name="Delta">Изменение к предыдущему периоду; процентные пункты для маржи, иначе процент.</param>
/// <param name="Series">Дневная динамика по активному периоду, питает спарклайн.</param>
public sealed record KpiCardModel(
    decimal? Value,
    DeltaModel? Delta,
    IReadOnlyList<SeriesPointModel> Series);

/// <summary>
/// Лидер по валовой прибыли за период (api.md, <c>BestManagerDto</c>).
/// Отсутствует, когда период вообще не дал продаж — карточка тогда показывает
/// свой плейсхолдер «нет продаж за период».
/// </summary>
public sealed record BestManagerModel(
    Guid Id,
    string Name,
    string? Avatar,
    string Initials,
    decimal GrossProfit,
    int SalesCount,
    DeltaModel? Delta,
    IReadOnlyList<SeriesPointModel> Series);
