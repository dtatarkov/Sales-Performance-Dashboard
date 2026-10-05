using SalesDashboard.Domain;

namespace SalesDashboard.Domain.Tests;

/// <summary>
/// Границы минимальных порогов выборки (domain.md, «Константы внимания»).
/// Пороги — часть спецификации, а не деталь реализации: тесты фиксируют их
/// значения и границу «>=», чтобы изменение порога было осознанным решением.
/// Ниже порога доля — артефакт малой выборки, и её нельзя показывать вовсе.
/// </summary>
public class MetricThresholdsTests
{
    private readonly MetricThresholds _thresholds = MetricThresholds.Default;

    /// <summary>Порог для возвратов = 8 продаж на продукт; 7 — ещё недостаточно, 8 — уже достаточно.</summary>
    [Theory]
    [InlineData(7, false)]
    [InlineData(8, true)]
    [InlineData(9, true)]
    public void RefundSample_FloorIsEight(int sales, bool expected)
        => Assert.Equal(expected, _thresholds.HasEnoughRefundSample(sales));

    /// <summary>Порог для отмен = 5 разрешившихся сделок на менеджера; 4 — недостаточно, 5 — достаточно.</summary>
    [Theory]
    [InlineData(4, false)]
    [InlineData(5, true)]
    public void CancellationSample_FloorIsFive(int resolved, bool expected)
        => Assert.Equal(expected, _thresholds.HasEnoughCancellationSample(resolved));

    /// <summary>Минимум базы динамики = 5 заказов базового периода; 4 — недостаточно, 5 — достаточно.</summary>
    [Theory]
    [InlineData(4, false)]
    [InlineData(5, true)]
    public void DynamicsBase_FloorIsFive(int baseOrders, bool expected)
        => Assert.Equal(expected, _thresholds.HasEnoughDynamicsBase(baseOrders));
}
