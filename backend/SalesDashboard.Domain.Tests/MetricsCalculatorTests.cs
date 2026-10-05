using SalesDashboard.Domain;

namespace SalesDashboard.Domain.Tests;

/// <summary>
/// Результирующие метрики оплаченной когорты (domain.md, «Revenue — выручка»,
/// «Gross Profit — валовая прибыль», «Margin», «Average Check — средний чек»).
/// Повторяющееся правило: пустой знаменатель даёт <c>null</c> (UI печатает `—`),
/// но не ноль и не NaN.
/// </summary>
public class MetricsCalculatorTests
{
    private readonly ResultMetricsCalculator _result = new();

    /// <summary>Валовая прибыль — выручка минус себестоимость.</summary>
    [Fact]
    public void Calculate_GrossProfit_IsRevenueMinusCost()
    {
        var metrics = _result.Calculate(revenue: 1_000_000m, cost: 620_000m, salesCount: 40);

        Assert.Equal(380_000m, metrics.GrossProfit);
    }

    /// <summary>Маржа — процент от выручки, считается по агрегату за период.</summary>
    [Fact]
    public void Calculate_Margin_IsPercentOfRevenue()
    {
        var metrics = _result.Calculate(revenue: 1_000_000m, cost: 620_000m, salesCount: 40);

        Assert.Equal(38m, metrics.Margin);
    }

    /// <summary>Средний чек — выручка на одну продажу.</summary>
    [Fact]
    public void Calculate_AverageCheck_IsRevenuePerSale()
    {
        var metrics = _result.Calculate(revenue: 1_000_000m, cost: 620_000m, salesCount: 40);

        Assert.Equal(25_000m, metrics.AverageCheck);
    }

    /// <summary>Пустой период: выручка 0 → маржа не определена.</summary>
    [Fact]
    public void Calculate_ZeroRevenue_MarginIsNull()
    {
        var metrics = _result.Calculate(revenue: 0m, cost: 0m, salesCount: 0);

        Assert.Null(metrics.Margin);
    }

    /// <summary>Ноль продаж в знаменателе → средний чек не определён, даже при ненулевой выручке.</summary>
    [Fact]
    public void Calculate_ZeroSalesCount_AverageCheckIsNull()
    {
        var metrics = _result.Calculate(revenue: 500m, cost: 100m, salesCount: 0);

        Assert.Null(metrics.AverageCheck);
    }

    /// <summary>Пустой период: валовая прибыль определена и равна 0, а не «—».</summary>
    [Fact]
    public void Calculate_EmptyPeriod_GrossProfitIsZero()
    {
        var metrics = _result.Calculate(revenue: 0m, cost: 0m, salesCount: 0);

        Assert.Equal(0m, metrics.GrossProfit);
    }

    /// <summary>Отрицательная валовая прибыль — реальный исход, а не ограничение снизу нулём.</summary>
    [Fact]
    public void Calculate_CostAboveRevenue_GrossProfitIsNegative()
    {
        var metrics = _result.Calculate(revenue: 100m, cost: 140m, salesCount: 2);

        Assert.Equal(-40m, metrics.GrossProfit);
        Assert.Equal(-40m, metrics.Margin);
    }
}

