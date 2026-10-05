using SalesDashboard.Domain;

namespace SalesDashboard.Domain.Tests;

/// <summary>
/// Значения вкладов и длины баров (api.md: <c>valueRelative</c> — доля или
/// кратность, <c>valueNormalized</c> — бар 0–100, масштабируемый к максимуму
/// группы — «Длина бара — визуальный масштаб значения, а не доля»).
/// </summary>
public class ContributionCalculatorTests
{
    private readonly ContributionCalculator _contribution = new();

    [Fact]
    public void RelativePercent_IsShareOfTotal()
        => Assert.Equal(26.2m, _contribution.RelativePercent(262m, 1_000m));

    /// <summary>Нулевая сумма группы → доли нет, печатается `—`.</summary>
    [Fact]
    public void RelativePercent_ZeroTotal_ReturnsNull()
        => Assert.Null(_contribution.RelativePercent(0m, 0m));

    /// <summary>
    /// Отрицательный член против положительной суммы — настоящая (отрицательная)
    /// доля и не должна схлопываться в null — api.md показывает лидера с
    /// отрицательной ВП.
    /// </summary>
    [Fact]
    public void RelativePercent_NegativeValue_KeepsSign()
        => Assert.Equal(-20m, _contribution.RelativePercent(-200m, 1_000m));

    [Fact]
    public void RelativeMultiple_IsValueOverAverageCheck()
        => Assert.Equal(1.7m, _contribution.RelativeMultiple(170m, 100m));

    [Fact]
    public void RelativeMultiple_ZeroAverage_ReturnsNull()
        => Assert.Null(_contribution.RelativeMultiple(170m, 0m));

    [Fact]
    public void BarLength_GroupMaximum_IsFullWidth()
        => Assert.Equal(100m, _contribution.BarLength(500m, 500m));

    [Fact]
    public void BarLength_ScalesLinearlyToMaximum()
        => Assert.Equal(40m, _contribution.BarLength(200m, 500m));

    /// <summary>Empty group: no bar.</summary>
    [Fact]
    public void BarLength_ZeroMaximum_IsZero()
        => Assert.Equal(0m, _contribution.BarLength(0m, 0m));

    /// <summary>A loss-making row gets no bar rather than a reversed one (ui.md: «бар нулевой»).</summary>
    [Fact]
    public void BarLength_NegativeValue_IsZero()
        => Assert.Equal(0m, _contribution.BarLength(-50m, 500m));

    /// <summary>Bar length is a visual scale, so it never overflows the track.</summary>
    [Fact]
    public void BarLength_AboveMaximum_ClampsToHundred()
        => Assert.Equal(100m, _contribution.BarLength(900m, 500m));

    /// <summary>Contract invariant: group shares add to 100% (api.md, «Контрактный инвариант»).</summary>
    [Fact]
    public void RelativePercent_SharesOfGroup_SumTo100()
    {
        decimal total = 1_000m;
        var parts = new[] { 550m, 250m, 200m };

        var shares = parts.Sum(part => _contribution.RelativePercent(part, total)!.Value);

        Assert.Equal(100m, shares);
    }
}
