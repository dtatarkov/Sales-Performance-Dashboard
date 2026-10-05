namespace SalesDashboard.Domain;

/// <summary>
/// Дельты между периодами: относительный процент для метрик значений, процентные
/// пункты для метрик-долей (domain.md, «Динамика к прошлому периоду»).
/// </summary>
public interface IDeltaCalculator
{
    /// <summary>
    /// (текущее − предыдущее) ÷ предыдущее, процент.
    /// <c>null</c>, когда предыдущее значение равно нулю — база роста не определена.
    /// </summary>
    decimal? Percent(decimal current, decimal previous);

    /// <summary>
    /// текущее − предыдущее в процентных пунктах для метрик-долей.
    /// <c>null</c>, когда сама доля не определена (пустой знаменатель базы).
    /// </summary>
    decimal? PercentagePoints(decimal? current, decimal? previous);
}

/// <summary>Не имеющая состояния реализация <see cref="IDeltaCalculator"/>.</summary>
public sealed class DeltaCalculator : IDeltaCalculator
{
    public decimal? Percent(decimal current, decimal previous)
        => previous != 0
            ? (current - previous) / previous * 100
            : null;

    public decimal? PercentagePoints(decimal? current, decimal? previous)
        => current is null || previous is null
            ? null
            : current.Value - previous.Value;
}
