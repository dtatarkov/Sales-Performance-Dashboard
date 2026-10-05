using SalesDashboard.Domain;

namespace SalesDashboard.Domain.Tests;

/// <summary>
/// Изменения к предыдущему периоду (domain.md, «Изменение к предыдущему периоду (Δ)»).
/// При нулевой базе выводится «—», но не «+∞» и не 0%; дельты долей считаются
/// в процентных пунктах, поэтому переход с 2.0% на 2.4% читается как +0.4 п.п.,
/// а не «+20%».
/// </summary>
public class DeltaCalculatorTests
{
    private readonly DeltaCalculator _delta = new();

    [Theory]
    [InlineData(120.0, 100.0, 20.0)]
    [InlineData(80.0, 100.0, -20.0)]
    [InlineData(100.0, 100.0, 0.0)]
    [InlineData(150.0, 100.0, 50.0)]
    public void Percent_IsRelativeChange(double current, double previous, double expected)
        => Assert.Equal((decimal)expected, _delta.Percent((decimal)current, (decimal)previous));

    /// <summary>Нулевая база → рост не определён (domain.md: «При Meta_prev = 0 → —»).</summary>
    [Fact]
    public void Percent_ZeroPrevious_ReturnsNull()
        => Assert.Null(_delta.Percent(current: 500m, previous: 0m));

    /// <summary>0 → 0 тоже не определён: роста нет, но нет и базы для деления.</summary>
    [Fact]
    public void Percent_BothZero_ReturnsNull()
        => Assert.Null(_delta.Percent(current: 0m, previous: 0m));

    /// <summary>Рост с нуля не имеет относительного смысла, даже если текущее значение велико.</summary>
    [Fact]
    public void Percent_GrowthFromZero_ReturnsNull()
        => Assert.Null(_delta.Percent(current: 1_000_000m, previous: 0m));

    [Fact]
    public void PercentagePoints_IsArithmeticDifference()
        => Assert.Equal(0.4m, _delta.PercentagePoints(2.4m, 2.0m));

    [Fact]
    public void PercentagePoints_NegativeMove_IsNegative()
        => Assert.Equal(-1.5m, _delta.PercentagePoints(2.0m, 3.5m));

    /// <summary>Любая из сторон не определена → дельта не определена (domain.md, строка «При пустом знаменателе доли»).</summary>
    [Theory]
    [InlineData(null, 2.0)]
    [InlineData(2.0, null)]
    [InlineData(null, null)]
    public void PercentagePoints_AnySideNull_ReturnsNull(double? current, double? previous)
    {
        decimal? currentDecimal = current is null ? null : (decimal)current;
        decimal? previousDecimal = previous is null ? null : (decimal)previous;

        Assert.Null(_delta.PercentagePoints(currentDecimal, previousDecimal));
    }
}
