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
/// Динамика клиентов (ui.md, блок 5): две готовые секции — «Рост» и «Падение».
/// В каждой секции те же два датасета метрик («Валовая прибыль», «Средний
/// чек»), а внутри датасета — готовый топ-<c>Dyn Top N</c> по абсолютной Δ.
/// Сервер сам фильтрует, ранжирует и режет секции; клиент готовые числа не
/// разбирает (frontend.md, «Бизнес-логики на клиенте нет»).
/// </summary>
public sealed record CustomerDynamicsModel(
    IReadOnlyList<DatasetModel<CustomerDynamicsItemModel>> Growth,
    IReadOnlyList<DatasetModel<CustomerDynamicsItemModel>> Decline);

/// <summary>
/// Строка секции динамики клиентов (ui.md, блок 5).
/// </summary>
/// <param name="Value">Длина бара, 0–100 — доля максимума своей секции датасета.</param>
/// <param name="AbsoluteDelta">Абсолютная разность метрик между периодами, печатается первой строкой у бара.</param>
/// <param name="Delta">Относительная дельта, печатается второй строкой у бара; <c>null</c>, когда базовая метрика пуста.</param>
public sealed record CustomerDynamicsItemModel(
    Guid Id,
    string Name,
    decimal Value,
    decimal AbsoluteDelta,
    DeltaModel? Delta);
