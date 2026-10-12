using SalesDashboard.Domain;
using SalesDashboard.Infrastructure.Persistence;

namespace SalesDashboard.Api.Tests.Scenarios;

/// <summary>
/// Мир «Динамика клиентов»: семь клиентов роста и шесть клиентов падения с
/// контролируемыми размахами ВП и среднего чека. Порядок секций по ВП сознательно
/// отличается от порядка по среднему чеку, а седьмой растущий клиент имеет
/// нулевой размах ВП — он есть в среднем чеке, но не в ВП. Плюс новый клиент
/// без прошлого и клиент, полностью вернувший оплату, — оба исключаются.
/// </summary>
public sealed class DynamicsWorld(PostgresFixture postgres) : IAsyncLifetime
{
    private static readonly DateTime D = new(2026, 9, 14, 0, 0, 0, DateTimeKind.Utc);

    private static DateTime Day(int offset)
        => new(D.Year, D.Month, D.Day + offset, 9, 0, 0, DateTimeKind.Utc);

    /// <summary>Начало активного периода.</summary>
    public static DateTime PeriodFrom => D;

    /// <summary>Конец активного периода — полночь восьмого дня: период
    /// целодневный, как требует валидатор (PERIOD_NOT_DAY_ALIGNED); сделки
    /// стоят до шестого дня включительно, так что конец периода их не режет.</summary>
    public static DateTime PeriodTo => D.AddDays(7);

    /// <summary>Поднятый мир с API-хостом.</summary>
    public DashboardScenarioHost Host { get; private set; } = null!;

    /// <summary>Клиенты роста: Г1..Г7 в порядке добавления.</summary>
    public IReadOnlyList<CustomerEntity> Growers { get; private set; } = [];

    /// <summary>Клиенты падения: Д1..Д6 в порядке добавления.</summary>
    public IReadOnlyList<CustomerEntity> Decliners { get; private set; } = [];

    /// <summary>Новый клиент без прошлого периода.</summary>
    public CustomerEntity Newcomer { get; private set; } = null!;

    /// <summary>Клиент, полностью вернувший единственную оплату.</summary>
    public CustomerEntity FullyRefunded { get; private set; } = null!;

    public async Task InitializeAsync()
    {
        Host = await DashboardScenarioHost.StartAsync(postgres, Seed);
    }

    public async Task DisposeAsync()
    {
        await Host.DisposeAsync();
    }

    /// <summary>
    /// Сеет пары «текущая/предыдущая сделка» на клиента: роста — (1000,500)…(200,100),
    /// падения — зеркально; новый клиент и полностью возвращённая оплата — без базы.
    /// </summary>
    /// <param name="graph">Конструктор данных мира.</param>
    private void Seed(TestGraph graph)
    {
        var manager = graph.AddManager("Олег Размах", "ОР", "Динамика");
        var category = graph.AddCategory("Динамическое");
        var product = graph.AddProduct("Товар размахов", "DYN-1", category, 1000m, 500m);
        var growerNames = new[] { "Годвин", "Гордон", "Гектор", "Глеб", "Гарри", "Гавриил", "Герман" };

        // Пары «выручка, себестоимость» текущей сделки: ВП и средний чек дают
        // разные порядки секций роста.
        var growerDeals = new (decimal Revenue, decimal Cost)[]
        {
            (1000m, 500m),
            (800m, 100m),
            (600m, 300m),
            (500m, 250m),
            (400m, 200m),
            (300m, 150m),
            (200m, 100m),
        };

        var growers = new List<CustomerEntity>();

        for (var index = 0; index < growerNames.Length; index++)
        {
            var grower = graph.AddCustomer(growerNames[index], growerNames[index], CustomerSegment.Enterprise, 2020);

            growers.Add(grower);

            graph.AddPaidSale(manager, grower, Day(1), new SaleItemSpec(product, 1, growerDeals[index].Revenue, growerDeals[index].Cost));
            graph.AddPaidSale(manager, grower, Day(-1), new SaleItemSpec(product, 1, 100m, 50m));
        }

        Growers = growers;

        var declinerNames = new[] { "Денис", "Дорофей", "Давид", "Даниил", "Демьян", "Дионис" };
        var declinerRevenues = new[] { 600m, 700m, 400m, 300m, 200m, 150m };
        var declinerCosts = new[] { 100m, 250m, 100m, 50m, 50m, 25m };
        var decliners = new List<CustomerEntity>();

        for (var index = 0; index < declinerNames.Length; index++)
        {
            var decliner = graph.AddCustomer(declinerNames[index], declinerNames[index], CustomerSegment.MidMarket, 2021);

            decliners.Add(decliner);

            graph.AddPaidSale(manager, decliner, Day(1), new SaleItemSpec(product, 1, 100m, 50m));
            graph.AddPaidSale(manager, decliner, Day(-1), new SaleItemSpec(product, 1, declinerRevenues[index], declinerCosts[index]));
        }

        Decliners = decliners;

        Newcomer = graph.AddCustomer("Нестор", "Нестор", CustomerSegment.Smb, 2025);

        graph.AddPaidSale(manager, Newcomer, Day(1), new SaleItemSpec(product, 1, 700m, 350m));

        FullyRefunded = graph.AddCustomer("Фёдор", "Фёдор", CustomerSegment.Smb, 2025);

        graph.AddRefundedSale(manager, FullyRefunded, Day(1), Day(2), new SaleItemSpec(product, 1, 100m, 40m));
    }
}

/// <summary>
/// Проверки динамики клиентов: секции роста и падения по размаху, топ-5,
/// нормализация к максимуму секции, расхождение порядков датасетов ВП и
/// среднего чека, исключение строк с неопределённой Δ.
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class DynamicsWorldTests : IClassFixture<DynamicsWorld>
{
    private readonly DynamicsWorld _world;

    public DynamicsWorldTests(DynamicsWorld world) => _world = world;

    [Fact]
    public async Task Growth_section_ranks_by_gp_swing_and_cuts_to_five()
    {
        var dashboard = await _world.Host.PostDashboardAsync(DynamicsWorld.PeriodFrom, DynamicsWorld.PeriodTo, null);

        var growthGp = dashboard.CustomerDynamics.Growth[0];

        Assert.Equal("Валовая прибыль", growthGp.Name);

        // Размахи ВП: 650, 450, 250, 150, 100, 50, 0 → топ-5 по убыванию;
        // Гавриил (+50) и Герман (0) за пределами.
        Assert.Equal(5, growthGp.Items.Count);
        Assert.Equal(_world.Growers[1].Id, growthGp.Items[0].Id);
        Assert.Equal(_world.Growers[0].Id, growthGp.Items[1].Id);
        Assert.Equal(_world.Growers[2].Id, growthGp.Items[2].Id);
        Assert.Equal(_world.Growers[3].Id, growthGp.Items[3].Id);
        Assert.Equal(_world.Growers[4].Id, growthGp.Items[4].Id);

        // Абсолютная Δ — сам размах; нормализация — к максимуму секции (650).
        var leader = growthGp.Items[0];
        Assert.Equal(650m, leader.DeltaAbsolute);
        Assert.Equal(100m, leader.ValueNormalized);

        var second = growthGp.Items[1];
        Assert.Equal(450m, second.DeltaAbsolute);
        Assert.Equal(450m / 650m * 100m, second.ValueNormalized);

        // Относительная Δ строки: (700 − 50) / 50 × 100 для лидера.
        ScenarioAssertions.DeltaIs(leader.DeltaRelative!, 1300m, DeltaUnit.Percent);
    }

    [Fact]
    public async Task Average_check_dataset_orders_differently_from_gp()
    {
        var dashboard = await _world.Host.PostDashboardAsync(DynamicsWorld.PeriodFrom, DynamicsWorld.PeriodTo, null);

        var growthAc = dashboard.CustomerDynamics.Growth[1];

        Assert.Equal("Средний чек", growthAc.Name);

        // Размахи среднего чека: 900, 700, 500, 400, 300, 200, 100 — лидер
        // другой, и Герман (+100) попадает в топ по AC, но не по ВП.
        Assert.Equal(_world.Growers[0].Id, growthAc.Items[0].Id);
        Assert.Equal(_world.Growers[1].Id, growthAc.Items[1].Id);
        Assert.Equal(900m, growthAc.Items[0].DeltaAbsolute);
        Assert.Equal(100m, growthAc.Items[0].ValueNormalized);

        // В GP-секции Германа нет, в AC-секции тоже не влез (7 строк).
        var growthGpNames = dashboard.CustomerDynamics.Growth[0].Items.Select(item => item.Name).ToList();
        var growthAcNames = growthAc.Items.Select(item => item.Name).ToList();

        Assert.DoesNotContain("Герман", growthGpNames);
        Assert.DoesNotContain("Герман", growthAcNames);

        // Шестой по AC (Гавриил, +200) и седьмой (Герман, +100) — за пределами.
        Assert.DoesNotContain("Гавриил", growthAcNames);
    }

    [Fact]
    public async Task Decline_section_orders_from_deepest_drop_and_normalizes_abs()
    {
        var dashboard = await _world.Host.PostDashboardAsync(DynamicsWorld.PeriodFrom, DynamicsWorld.PeriodTo, null);

        var declineGp = dashboard.CustomerDynamics.Decline[0];
        var declineAc = dashboard.CustomerDynamics.Decline[1];

        // Размахи ВП: −450, −400, −250, −200, −100, −75 → от большего минуса;
        // Дионис (−75) — за пределами топ-5.
        Assert.Equal(_world.Decliners[0].Id, declineGp.Items[0].Id);
        Assert.Equal(_world.Decliners[1].Id, declineGp.Items[1].Id);
        Assert.Equal(_world.Decliners[4].Id, declineGp.Items[4].Id);
        Assert.Equal(-450m, declineGp.Items[0].DeltaAbsolute);
        Assert.Equal(-100m, declineGp.Items[4].DeltaAbsolute);

        // Бар падения нормируется по модулю к максимуму секции (450).
        Assert.Equal(100m, declineGp.Items[0].ValueNormalized);
        Assert.Equal(400m / 450m * 100m, declineGp.Items[1].ValueNormalized);

        // В AC-датасете Дорофей падает глубже (−600 против −500) — порядок
        // первых двух меняется относительно ВП.
        Assert.Equal(_world.Decliners[1].Id, declineAc.Items[0].Id);
        Assert.Equal(-600m, declineAc.Items[0].DeltaAbsolute);
        Assert.Equal(_world.Decliners[0].Id, declineAc.Items[1].Id);
        Assert.Equal(-500m, declineAc.Items[1].DeltaAbsolute);
    }

    [Fact]
    public async Task New_and_fully_refunded_clients_are_excluded()
    {
        var dashboard = await _world.Host.PostDashboardAsync(DynamicsWorld.PeriodFrom, DynamicsWorld.PeriodTo, null);

        var growthNames = dashboard.CustomerDynamics.Growth
            .SelectMany(dataset => dataset.Items)
            .Select(item => item.Name)
            .ToList();

        var declineNames = dashboard.CustomerDynamics.Decline
            .SelectMany(dataset => dataset.Items)
            .Select(item => item.Name)
            .ToList();

        // Новый клиент (нет базы Δ) и полностью возвращённая оплата (нулевая
        // денежная база) не участвуют ни в одной секции.
        Assert.DoesNotContain("Нестор", growthNames);
        Assert.DoesNotContain("Нестор", declineNames);
        Assert.DoesNotContain("Фёдор", growthNames);
        Assert.DoesNotContain("Фёдор", declineNames);
    }
}
