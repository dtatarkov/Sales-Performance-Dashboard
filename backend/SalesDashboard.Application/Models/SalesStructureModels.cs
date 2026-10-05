namespace SalesDashboard.Application.Models;

/// <summary>
/// Дневная динамика (api.md, блок 6). Три набора данных — выручка, валовая
/// прибыль, число продаж — каждый непрерывная серия по активному периоду.
/// </summary>
public sealed record TimeSeriesModel(IReadOnlyList<DatasetModel<TimeSeriesPointModel>> Datasets);

/// <summary>
/// Один день графика (api.md, <c>TimeSeriesPointModel</c>).
/// </summary>
/// <param name="Date">День, к которому относится точка.</param>
/// <param name="ValueCurrent">Сплошная линия: значение внутри активного периода. Дни без продаж несут 0, чтобы линия оставалась непрерывной.</param>
/// <param name="ValuePrevious">Пунктирная линия: тот же день предыдущего периода. Периоды всегда равны по длительности, поэтому значение не бывает null.</param>
public sealed record TimeSeriesPointModel(
    DateTime Date,
    decimal ValueCurrent,
    decimal? ValuePrevious);

/// <summary>
/// Продажи по категориям (api.md, блок 7). Два набора данных — выручка и
/// валовая прибыль — каждый с суммой группы в центре бублика.
/// </summary>
public sealed record CategoriesModel(IReadOnlyList<CategoryDatasetModel> Datasets);

/// <summary>
/// Набор данных категорий (api.md, <c>CategoryDatasetDto</c>): набор плюс сумма,
/// по которой рисуется его бублик.
/// </summary>
/// <param name="Total">Метрика набора, просуммированная по всем категориям.</param>
public sealed record CategoryDatasetModel(
    string Name,
    IReadOnlyList<CategoryItemModel> Items,
    decimal Total);

/// <summary>
/// Одна строка категории (api.md, <c>CategoryItemModel</c>).
/// Возвраты намеренно отсутствуют — единый источник истины по ним это блоки
/// товаров и возвратов (api.md, примечание к блоку 7).
/// </summary>
/// <param name="Share">Срез этой категории в метрике набора, 0–100.</param>
public sealed record CategoryItemModel(
    Guid Id,
    string Name,
    decimal Revenue,
    DeltaModel? RevenueDelta,
    decimal GrossProfit,
    DeltaModel? GrossProfitDelta,
    decimal? Margin,
    DeltaModel? MarginDelta,
    int SalesCount,
    DeltaModel? SalesCountDelta,
    decimal Share);

/// <summary>
/// Топ-10 товаров (api.md, блок 8), ранжированный по наборам: выручка, валовая
/// прибыль или проданные единицы.
/// </summary>
public sealed record ProductsModel(IReadOnlyList<DatasetModel<ProductItemModel>> Datasets);

/// <summary>
/// Одна строка товара (api.md, <c>ProductItemModel</c>).
/// </summary>
/// <param name="GrossProfit">Может быть отрицательной; печатается как есть, никогда не прижимается.</param>
public sealed record ProductItemModel(
    Guid Id,
    string Name,
    string Sku,
    string Category,
    decimal Revenue,
    DeltaModel? RevenueDelta,
    decimal GrossProfit,
    DeltaModel? GrossProfitDelta,
    int Units,
    DeltaModel? UnitsDelta,
    decimal? Margin,
    DeltaModel? MarginDelta,
    decimal? RefundRate,
    DeltaModel? RefundRateDelta,
    ContributionModel Contribution);
