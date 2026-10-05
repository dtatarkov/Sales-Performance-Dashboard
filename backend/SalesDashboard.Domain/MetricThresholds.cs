namespace SalesDashboard.Domain;

/// <summary>
/// Минимальные размеры выборки из domain.md («Константы внимания»). Ниже
/// минимума отношение — артефакт малой выборки и не печатается вовсе.
/// </summary>
public sealed record MetricThresholds
{
    public static MetricThresholds Default { get; } = new();

    /// <summary>Минимальная выборка возвратов: продажи на товар, ниже которых доля возвратов не печатается.</summary>
    public int RefundMinSample { get; init; } = 8;

    /// <summary>Минимальная выборка отмен: закрытые сделки на менеджера, ниже которых доля не печатается.</summary>
    public int CancellationMinSample { get; init; } = 5;

    /// <summary>Минимальная база динамики: заказы базового периода, необходимые для блока динамики клиентов.</summary>
    public int DynMinBaseOrders { get; init; } = 5;

    /// <summary>Топ N динамики: размер секций «Рост» / «Спад».</summary>
    public int DynTopN { get; init; } = 5;

    /// <summary>
    /// Достаточно ли продаж за долей возвратов, чтобы её печатать. Ниже порога
    /// значение — артефакт малой выборки, а не сигнал.
    /// </summary>
    public bool HasEnoughRefundSample(int salesCount) => salesCount >= RefundMinSample;

    /// <summary>Достаточно ли закрытых сделок за долей отмен, чтобы её печатать.</summary>
    public bool HasEnoughCancellationSample(int resolvedCount) => resolvedCount >= CancellationMinSample;

    /// <summary>Проходит ли клиент в блок динамики по объёму базового периода.</summary>
    public bool HasEnoughDynamicsBase(int baseOrderCount) => baseOrderCount >= DynMinBaseOrders;
}

