namespace SalesDashboard.Domain;

/// <summary>
/// Производные результатные метрики периода: валовая прибыль, маржа, средний чек
/// (domain.md, «Sales by paid cohort» + «Revenue, cost and gross profit»).
/// </summary>
/// <param name="GrossProfit">Выручка − Себестоимость.</param>
/// <param name="Margin">Маржа в процентах от выручки; <c>null</c>, когда выручка равна нулю (не определена).</param>
/// <param name="AverageCheck">Выручка ÷ число продаж оплаченной когорты; <c>null</c>, когда число равно нулю.</param>
public sealed record ResultMetrics(
    decimal GrossProfit,
    decimal? Margin,
    decimal? AverageCheck);

/// <summary>
/// Вычисляет производные результатные метрики из сырых итогов периода.
/// </summary>
public interface IResultMetricsCalculator
{
    /// <param name="revenue">Чистая выручка оплаченной когорты (без возвратов).</param>
    /// <param name="cost">Себестоимость, сопоставленная оплаченной когорте.</param>
    /// <param name="salesCount">Число продаж оплаченной когорты — возвращённые продажи остаются в знаменателе
    /// (domain.md, правило «Средний чок» / «Средний чек»).</param>
    ResultMetrics Calculate(decimal revenue, decimal cost, int salesCount);
}

/// <summary>Не имеющая состояния реализация <see cref="IResultMetricsCalculator"/>.</summary>
public sealed class ResultMetricsCalculator : IResultMetricsCalculator
{
    public ResultMetrics Calculate(decimal revenue, decimal cost, int salesCount)
    {
        var grossProfit = revenue - cost;

        decimal? margin = revenue != 0
            ? grossProfit / revenue * 100
            : null;

        decimal? averageCheck = salesCount > 0
            ? revenue / salesCount
            : null;

        return new ResultMetrics(grossProfit, margin, averageCheck);
    }
}
