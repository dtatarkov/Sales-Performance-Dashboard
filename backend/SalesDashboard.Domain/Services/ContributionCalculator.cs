namespace SalesDashboard.Domain;

/// <summary>
/// Значения относительного вклада и длины баров для ранжируемых наборов данных
/// (domain.md, «Правила группировки датасетов» / «Длины баров»).
/// </summary>
public interface IContributionCalculator
{
    /// <summary>
    /// Значение в процентах от суммы группы (наборы gp / revenue / unit).
    /// <c>null</c>, когда сумма равна нулю — доля не определена.
    /// </summary>
    decimal? RelativePercent(decimal value, decimal total);

    /// <summary>
    /// Значение как кратность среднему чеку группы, напр. 1.7 (набор ac, «× к СЧ»).
    /// <c>null</c>, когда средний чек равен нулю.
    /// </summary>
    decimal? RelativeMultiple(decimal value, decimal average);

    /// <summary>
    /// Длина бара 0–100, линейно масштабируемая до максимума группы (максимум → 100).
    /// Ноль, когда максимум неположительный; отрицательные значения прижимаются к нулю.
    /// </summary>
    decimal BarLength(decimal value, decimal groupMax);
}

/// <summary>Не имеющая состояния реализация <see cref="IContributionCalculator"/>.</summary>
public sealed class ContributionCalculator : IContributionCalculator
{
    public decimal? RelativePercent(decimal value, decimal total)
        => total != 0
            ? value / total * 100
            : null;

    public decimal? RelativeMultiple(decimal value, decimal average)
        => average != 0
            ? value / average
            : null;

    public decimal BarLength(decimal value, decimal groupMax)
    {
        if (groupMax <= 0 || value <= 0)
            return 0;

        var length = value / groupMax * 100;
        return length > 100 ? 100 : length;
    }
}
