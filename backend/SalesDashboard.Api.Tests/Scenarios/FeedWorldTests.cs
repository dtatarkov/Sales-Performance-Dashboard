using SalesDashboard.Domain;
using SalesDashboard.Infrastructure.Persistence;

namespace SalesDashboard.Api.Tests.Scenarios;

/// <summary>
/// Мир «Лента»: 25 оплаченных сделок с разным временем оплаты, две из которых
/// возвращены, плюс отменённая сделка (без оплаты) и оплаченные сделки за
/// границами периода. Проверяет обрезку до 20 строк, порядок по убыванию даты
/// оплаты и производные поля строки.
/// </summary>
public sealed class FeedWorld(PostgresFixture postgres) : IAsyncLifetime
{
    private static readonly DateTime D = new(2026, 9, 10, 0, 0, 0, DateTimeKind.Utc);

    private static DateTime At(int dayOffset, int hour)
        => new(D.Year, D.Month, D.Day + dayOffset, hour, 0, 0, DateTimeKind.Utc);

    /// <summary>Начало периода.</summary>
    public static DateTime PeriodFrom => D;

    public static DateTime PeriodTo => At(7, 0);

    /// <summary>Момент внутри периода: день от начала и час.</summary>
    /// <param name="dayOffset">Смещение в днях от начала периода.</param>
    /// <param name="hour">Час суток.</param>
    public static DateTime Moment(int dayOffset, int hour) => At(dayOffset, hour);

    /// <summary>Сделка с двумя позициями — для itemsCount.</summary>
    public SaleEntity TwoItemSale { get; private set; } = null!;

    /// <summary>Возвращённая сделка первой половины периода.</summary>
    public SaleEntity RefundedEarly { get; private set; } = null!;

    /// <summary>Возвращённая сделка второй половины периода.</summary>
    public SaleEntity RefundedLate { get; private set; } = null!;

    /// <summary>Отменённая сделка — в ленту не попадает.</summary>
    public SaleEntity Cancelled { get; private set; } = null!;

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
    /// Сеет 25 оплаченных сделок по часам двух дней (возвраты в 5-й и 20-й),
    /// отмену и сделки за границами периода.
    /// </summary>
    /// <param name="graph">Конструктор данных мира.</param>
    private void Seed(TestGraph graph)
    {
        var manager = graph.AddManager("Тимофей Лента", "ТЛ", "Лента");
        var customer = graph.AddCustomer("ООО Поток", "Поток", CustomerSegment.Enterprise, 2020);
        var category = graph.AddCategory("Ленточное");
        var product = graph.AddProduct("Товар потока", "FEED-1", category, 100m, 40m);

        var saleIndex = 0;

        // 25 сделок: 13 в первый день (9:00–21:00), 12 во второй (9:00–20:00);
        // 6-я возвращается на следующий день, 21-я — внутри периода.
        for (var hour = 9; hour <= 21 && saleIndex < 25; hour++, saleIndex++)
        {
            CreateFeedSale(graph, manager, customer, product, saleIndex, At(0, hour));
        }

        for (var hour = 9; hour <= 20 && saleIndex < 25; hour++, saleIndex++)
        {
            CreateFeedSale(graph, manager, customer, product, saleIndex, At(1, hour));
        }

        Cancelled = graph.AddCancelledSale(manager, customer, At(3, 12), new SaleItemSpec(product, 1, 500m, 200m));

        // Границы периода: оплата до начала и после конца — вне ленты.
        graph.AddPaidSale(manager, customer, At(-1, 9), new SaleItemSpec(product, 1, 100m, 40m));
        graph.AddPaidSale(manager, customer, At(7, 9), new SaleItemSpec(product, 1, 100m, 40m));
    }

    /// <summary>
    /// Создаёт сделку ленты по её номеру: первая — с двумя позициями, шестая и
    /// двадцать первая — возвращённые, остальные — обычные оплаты.
    /// </summary>
    /// <param name="graph">Конструктор данных мира.</param>
    /// <param name="manager">Менеджер всех сделок.</param>
    /// <param name="customer">Клиент всех сделок.</param>
    /// <param name="product">Товар позиций.</param>
    /// <param name="saleIndex">Номер сделки (0–24).</param>
    /// <param name="paidAt">Момент оплаты.</param>
    private SaleEntity CreateFeedSale(
        TestGraph graph,
        ManagerEntity manager,
        CustomerEntity customer,
        ProductEntity product,
        int saleIndex,
        DateTime paidAt)
    {
        if (saleIndex == 0)
        {
            var sale = graph.AddPaidSale(manager, customer, paidAt, new SaleItemSpec(product, 1, 100m, 40m));

            return sale;
        }

        if (saleIndex == 5)
        {
            RefundedEarly = graph.AddRefundedSale(manager, customer, paidAt, At(1, 10), new SaleItemSpec(product, 1, 300m, 120m));

            return RefundedEarly;
        }

        if (saleIndex == 20)
        {
            RefundedLate = graph.AddRefundedSale(manager, customer, paidAt, At(2, 9), new SaleItemSpec(product, 1, 100m, 40m));

            return RefundedLate;
        }

        if (saleIndex == 24)
        {
            // Самая свежая сделка — с двумя позициями: остаётся в обрезанной
            // ленте и показывает itemsCount.
            TwoItemSale = graph.AddPaidSale(
                manager,
                customer,
                paidAt,
                new SaleItemSpec(product, 1, 100m, 40m),
                new SaleItemSpec(product, 2, 100m, 40m));

            return TwoItemSale;
        }

        var plainSale = graph.AddPaidSale(manager, customer, paidAt, new SaleItemSpec(product, 1, 100m, 40m));

        return plainSale;
    }
}

/// <summary>
/// Проверки ленты последних продаж: лимит 20, сортировка по paidAt по убыванию,
/// производные статус/gp/itemsCount, отсечение сделок вне когорты.
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class FeedWorldTests : IClassFixture<FeedWorld>
{
    private readonly FeedWorld _world;

    public FeedWorldTests(FeedWorld world) => _world = world;

    [Fact]
    public async Task Feed_limits_to_twenty_and_sorts_by_date_descending()
    {
        var dashboard = await _world.Host.PostDashboardAsync(FeedWorld.PeriodFrom, FeedWorld.PeriodTo, null);

        var sales = dashboard.RecentSales.Sales;

        // Когорта содержит 25 сделок — лента обрезается до 20.
        Assert.Equal(20, sales.Count);

        // Строгий порядок по убыванию времени оплаты.
        for (var index = 1; index < sales.Count; index++)
        {
            Assert.True(sales[index - 1].Date > sales[index].Date, $"Row {index - 1} is not newer than row {index}.");
        }

        // Голова и хвост: самые свежие сделки второго дня, хвост — 14:00 первого.
        Assert.Equal(FeedWorld.Moment(1, 20), sales[0].Date);
        Assert.Equal(FeedWorld.Moment(0, 14), sales[19].Date);

        // Сделки вне когорты периода не попадают в ленту.
        Assert.DoesNotContain(sales, sale => sale.Date < FeedWorld.PeriodFrom);
        Assert.DoesNotContain(sales, sale => sale.Date >= FeedWorld.PeriodTo);
    }

    [Fact]
    public async Task Feed_rows_carry_status_revenue_and_null_gp_for_refunds()
    {
        var dashboard = await _world.Host.PostDashboardAsync(FeedWorld.PeriodFrom, FeedWorld.PeriodTo, null);

        var sales = dashboard.RecentSales.Sales;

        // Обе возвращённые сделки в ленте со статусом 2 и null ВП; выручка —
        // сырая сумма позиций независимо от возврата.
        var early = Assert.Single(sales, sale => sale.Id == _world.RefundedEarly.Id);
        Assert.Equal(SaleStatus.Refunded, early.Status);
        Assert.Null(early.Gp);
        Assert.Equal(300m, early.Revenue);

        var late = Assert.Single(sales, sale => sale.Id == _world.RefundedLate.Id);
        Assert.Equal(SaleStatus.Refunded, late.Status);
        Assert.Null(late.Gp);

        // Оплаченная строка считает ВП по позициям.
        var clean = Assert.Single(sales, sale => sale.Date == FeedWorld.Moment(1, 19));
        Assert.Equal(SaleStatus.Paid, clean.Status);
        Assert.Equal(60m, clean.Gp);

        // Двухпозиционная сделка показывает количество позиций и ВП обеих.
        var twoItems = Assert.Single(sales, sale => sale.Date == FeedWorld.Moment(1, 20));
        Assert.Equal(2, twoItems.ItemsCount);
        Assert.Equal(300m, twoItems.Revenue);
        Assert.Equal(180m, twoItems.Gp);

        // Отменённая сделка (нет оплаты) и обе пограничные — вне ленты.
        Assert.DoesNotContain(sales, sale => sale.Id == _world.Cancelled.Id);
        Assert.Equal(18, sales.Count(sale => sale.Status == SaleStatus.Paid));
    }
}
