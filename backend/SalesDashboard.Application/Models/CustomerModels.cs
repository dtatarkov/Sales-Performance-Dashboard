namespace SalesDashboard.Application.Models;

/// <summary>
/// Топ-10 клиентов (api.md, блок 4), ранжированный по наборам: валовая прибыль
/// или средний чек.
/// </summary>
public sealed record CustomerTopModel(IReadOnlyList<DatasetModel<CustomerTopItemModel>> Datasets);

/// <summary>
/// Одна строка клиента (api.md, <c>CustomerTopItemModel</c>). Несёт обе доли
/// потерь, в отличие от рейтинга менеджеров, где только отмены — возвраты
/// отвечают за товар, но всё равно остаются на карточке клиента
/// (domain.md, «Ответственность»).
/// </summary>
public sealed record CustomerTopItemModel(
    Guid Id,
    string Name,
    int Since,
    int OrderCount,
    decimal Revenue,
    DeltaModel? RevenueDelta,
    decimal GrossProfit,
    DeltaModel? GrossProfitDelta,
    decimal AverageCheck,
    DeltaModel? AverageCheckDelta,
    decimal? Margin,
    DeltaModel? MarginDelta,
    decimal? RefundRate,
    DeltaModel? RefundRateDelta,
    decimal? CancellationRate,
    DeltaModel? CancellationRateDelta,
    ContributionModel Contribution);

/// <summary>
/// Динамика клиентов (api.md, блок 5): полный список клиентов, прошедших
/// <c>Dyn Min Base Orders</c>, упорядоченный по их изменению. UI нарезает его на
/// секции «Рост» и «Спад» по <c>Dyn Top N</c> в каждой.
/// </summary>
public sealed record CustomerDynamicsModel(
    IReadOnlyList<DatasetModel<CustomerDynamicsItemModel>> Datasets);

/// <summary>
/// Покачивание одного клиента между периодами (api.md, <c>CustomerDynamicsItemModel</c>).
/// </summary>
/// <param name="Value">Нормализованная дельта, −100…100; знак — направление (вверх = рост).</param>
/// <param name="Delta">Относительная дельта, печатается рядом с баром; <c>null</c>, когда базовая метрика пуста.</param>
public sealed record CustomerDynamicsItemModel(
    Guid Id,
    string Name,
    decimal Value,
    DeltaModel? Delta);
