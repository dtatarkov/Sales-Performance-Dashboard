using SalesDashboard.Api.Dtos;
using SalesDashboard.Domain;

namespace SalesDashboard.Api.Tests.Scenarios;

/// <summary>
/// Общие проверки контрактных объектов дашборда: Δ с единицей измерения,
/// отсутствие Δ и пустые секции динамики.
/// </summary>
internal static class ScenarioAssertions
{
    /// <summary>
    /// Проверяет, что Δ присутствует, и сверяет величину с единицей измерения.
    /// </summary>
    /// <param name="delta">Проверяемая Δ из ответа.</param>
    /// <param name="expectedValue">Ожидаемая величина.</param>
    /// <param name="expectedUnit">Ожидаемая единица: 1 — «%», 2 — «п.п.».</param>
    public static void DeltaIs(DeltaDto? delta, decimal expectedValue, DeltaUnit expectedUnit)
    {
        Assert.NotNull(delta);
        Assert.Equal(expectedValue, delta!.Value);
        Assert.Equal(expectedUnit, delta.Unit);
    }

    /// <summary>
    /// Проверяет, что поле Δ отсутствует (база равна нулю или не определена).
    /// </summary>
    /// <param name="delta">Проверяемая Δ из ответа.</param>
    public static void NoDelta(DeltaDto? delta)
        => Assert.Null(delta);

    /// <summary>
    /// Проверяет, что обе секции динамики клиентов пусты (нет строк с вычислимыми Δ).
    /// </summary>
    /// <param name="dynamics">Блок динамики клиентов из ответа.</param>
    public static void DynamicsEmpty(CustomerDynamicsDto dynamics)
    {
        var growthItems = dynamics.Growth.SelectMany(dataset => dataset.Items).ToList();

        var declineItems = dynamics.Decline.SelectMany(dataset => dataset.Items).ToList();

        Assert.Empty(growthItems);
        Assert.Empty(declineItems);
    }
}
