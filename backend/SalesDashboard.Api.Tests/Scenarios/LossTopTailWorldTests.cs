using SalesDashboard.Domain;
using SalesDashboard.Infrastructure.Persistence;

namespace SalesDashboard.Api.Tests.Scenarios;

/// <summary>
/// Мир «Топы потерь»: 12 товаров с возвратами и 11 менеджеров с отменами —
/// ровно за границей топ-10, поэтому обе группы дают топ-10 + хвост. Двум
/// парам объектов заданы равные суммы для tie-break по имени. Возвраты и
/// отмены распределены по дням, в последний день — единственный возврат:
/// узкий запрос этого дня даёт топ из одной строки без хвоста.
/// </summary>
public sealed class LossTopTailWorld(PostgresFixture postgres) : IAsyncLifetime
{
    private static readonly DateTime D = new(2026, 9, 10, 0, 0, 0, DateTimeKind.Utc);

    private static DateTime Day(int offset, int hour)
        => new(D.Year, D.Month, D.Day + offset, hour, 0, 0, DateTimeKind.Utc);

    /// <summary>Начало полного периода (12 дней).</summary>
    public static DateTime PeriodFrom => D;

    public static DateTime PeriodTo => Day(12, 0);

    /// <summary>День единственного возврата — для запроса без хвоста.</summary>
    public static DateTime SingleRefundDay => Day(11, 0);

    /// <summary>Поднятый мир с API-хостом.</summary>
    public DashboardScenarioHost Host { get; private set; } = null!;

    public async Task InitializeAsync()
    {
        Host = await DashboardScenarioHost.StartAsync(postgres, Seed);
    }

    public async Task DisposeAsync()
    {
        await Host.DisposeAsync();
    }

    /// <summary>
    /// Сеет возвраты 12 товаров и отмены 11 менеджеров: суммы
    /// [1200…300] с двумя парами по 850, оплаты возвратных сделок — в день
    /// события, плюс две чистые оплаты для непустой когорты.
    /// </summary>
    /// <param name="graph">Конструктор данных мира.</param>
    private void Seed(TestGraph graph)
    {
        var manager = graph.AddManager("Павел Потери", "ПП", "Потери");

        var customer = graph.AddCustomer("ООО Урон", "Урон", CustomerSegment.Smb, 2022);

        var category = graph.AddCategory("Уронное");

        // Возвраты по товарам: суммы по убыванию с ничьей 850.
        var refundNames = new[] { "Арбуз", "Батат", "Груша", "Абрикос", "Вишня", "Дыня", "Ежевика", "Жимолость", "Земляника", "Ирга", "Кизил", "Лимон" };

        var refundAmounts = new[] { 1200m, 1100m, 1000m, 850m, 850m, 700m, 600m, 500m, 400m, 300m, 200m, 100m };

        for (var index = 0; index < refundNames.Length; index++)
        {
            var product = graph.AddProduct(refundNames[index], $"LOSS-{index}", category, refundAmounts[index], refundAmounts[index] / 2);

            graph.AddRefundedSale(
                manager,
                customer,
                Day(index, 8),
                Day(index, 10),
                new SaleItemSpec(product, 1, refundAmounts[index], refundAmounts[index] / 2));
        }

        var lossProduct = FirstProduct(graph);

        // Отмены по менеджерам: суммы по убыванию с ничьей 850.
        var cancelAmounts = new[] { 1200m, 1100m, 1000m, 850m, 850m, 700m, 600m, 500m, 400m, 300m, 200m };

        for (var index = 0; index < cancelAmounts.Length; index++)
        {
            var canceller = graph.AddManager($"Отменщик {index + 1}", $"О{index + 1}", "Потери");

            graph.AddCancelledSale(canceller, customer, Day(index, 12), new SaleItemSpec(lossProduct, 1, cancelAmounts[index], cancelAmounts[index] / 2));
        }

        // Непустая когорта периода: две чистые оплаты.
        graph.AddPaidSale(manager, customer, Day(2, 14), new SaleItemSpec(lossProduct, 1, 100m, 40m));
        graph.AddPaidSale(manager, customer, Day(3, 14), new SaleItemSpec(lossProduct, 1, 100m, 40m));
    }

    /// <summary>Возвращает первый продукт мира — для позиций отмен и оплат.</summary>
    /// <param name="graph">Конструктор данных мира.</param>
    private static ProductEntity FirstProduct(TestGraph graph)
        => graph.Products[0];
}

/// <summary>
/// Проверки топов потерь: обрезка топ-10, хвост «Остальные N» с инвариантом
/// 100%, tie-break по имени, нормализация баров, топ без хвоста.
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class LossTopTailWorldTests : IClassFixture<LossTopTailWorld>
{
    private readonly LossTopTailWorld _world;

    public LossTopTailWorldTests(LossTopTailWorld world) => _world = world;

    [Fact]
    public async Task Refund_top_cuts_to_ten_and_tail_covers_the_rest()
    {
        var dashboard = await _world.Host.PostDashboardAsync(
            LossTopTailWorld.PeriodFrom, LossTopTailWorld.PeriodTo, null);

        var refunds = dashboard.Refunds;

        // Сумма всех 12 возвратов.
        Assert.Equal(7800m, refunds.Value);

        var top = refunds.Top;

        // Топ-10 по сумме; ничья 850 решается именем (Абрикос раньше Вишни).
        Assert.Equal(10, top.Count);
        Assert.Equal("Арбуз", top[0].Name);
        Assert.Equal("Батат", top[1].Name);
        Assert.Equal("Груша", top[2].Name);
        Assert.Equal("Абрикос", top[3].Name);
        Assert.Equal("Вишня", top[4].Name);
        Assert.Equal("Ирга", top[9].Name);

        // Доля строки от суммы группы и бар от максимума (1200).
        Assert.Equal(1200m / 7800m * 100m, top[0].ValueRelative);
        Assert.Equal(100m, top[0].ValueNormalized);
        Assert.Equal(850m / 1200m * 100m, top[4].ValueNormalized);

        // Хвост: 2 товара, сумма 300, доля дополняет топ до 100%.
        var tail = refunds.Tail!;
        Assert.Equal(2, tail.Count);
        Assert.Equal(300m, tail.ValueAbsolute);
        Assert.Equal(300m / 7800m * 100m, tail.ValueRelative);

        var totalShare = top.Sum(item => item.ValueRelative) + tail.ValueRelative;
        Assert.Equal(100m, totalShare);
    }

    [Fact]
    public async Task Cancellation_top_mirrors_the_mechanic_for_managers()
    {
        var dashboard = await _world.Host.PostDashboardAsync(
            LossTopTailWorld.PeriodFrom, LossTopTailWorld.PeriodTo, null);

        var cancellations = dashboard.Cancellations;

        // Сумма 11 отмен; событийная доля: 11 отмен / (14 оплат + 11 отмен) —
        // в когорте 2 чистые оплаты и 12 возвращённых сделок.
        Assert.Equal(7700m, cancellations.Value);
        Assert.Equal(11m / 25m * 100m, cancellations.Rate);

        var top = cancellations.Top;

        // Топ-10 с ничьей по имени; хвост — один менеджер с 200.
        Assert.Equal(10, top.Count);
        Assert.Equal("Отменщик 1", top[0].Name);
        Assert.Equal("Отменщик 4", top[3].Name);
        Assert.Equal("Отменщик 5", top[4].Name);
        Assert.Equal(1200m, top[0].ValueAbsolute);
        Assert.Equal(100m, top[0].ValueNormalized);

        var tail = cancellations.Tail!;
        Assert.Equal(1, tail.Count);
        Assert.Equal(200m, tail.ValueAbsolute);
        Assert.Equal(200m / 7700m * 100m, tail.ValueRelative);
    }

    [Fact]
    public async Task Narrow_period_with_single_refund_has_no_tail()
    {
        // В последний день периода ровно один возврат — Лимон.
        var dashboard = await _world.Host.PostDashboardAsync(
            LossTopTailWorld.SingleRefundDay, LossTopTailWorld.PeriodTo, null);

        var refunds = dashboard.Refunds;

        var topItem = Assert.Single(refunds.Top);
        Assert.Equal("Лимон", topItem.Name);
        Assert.Equal(100m, topItem.ValueAbsolute);
        Assert.Equal(100m, topItem.ValueRelative);

        // За топом никого — хвоста нет.
        Assert.Null(refunds.Tail);
    }
}
