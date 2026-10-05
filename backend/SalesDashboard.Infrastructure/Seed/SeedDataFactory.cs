using SalesDashboard.Domain;
using SalesDashboard.Infrastructure.Persistence;

namespace SalesDashboard.Infrastructure.Seed;

/// <summary>Весь граф сущностей, который сидер сохраняет в базу, в порядке зависимостей.</summary>
public sealed record SeedData(
    IReadOnlyList<ManagerEntity> Managers,
    IReadOnlyList<CustomerEntity> Customers,
    IReadOnlyList<CategoryEntity> Categories,
    IReadOnlyList<ProductEntity> Products,
    IReadOnlyList<SaleEntity> Sales);

/// <summary>
/// Детерминированный генератор данных (backend.md §5.4): фиксированный seed
/// случайности и фиксированная опорная дата, 12 месяцев продаж до неё,
/// сезонность, сильные и слабые менеджеры, отмены и возвраты с вероятностями,
/// зависящими от менеджера, товара и сегмента клиента. Базы не касается —
/// только строит граф.
/// </summary>
public sealed class SeedDataFactory
{
    /// <summary>Фиксированный seed случайности: данные воспроизводимы от запуска к запуску.</summary>
    private const int RandomSeed = 20261003;

    /// <summary>Сколько всего клиентов генерируется.</summary>
    private const int CustomerCount = 70;

    /// <summary>Сколько клиентов Enterprise (далее MidMarket, остальные SMB).</summary>
    private const int EnterpriseCustomerCount = 10;

    /// <summary>Сколько клиентов MidMarket после первых Enterprise.</summary>
    private const int MidMarketCustomerCount = 25;

    /// <summary>Сколько товаров в каждой категории.</summary>
    private const int ProductsPerCategory = 6;

    /// <summary>Первый номер SKU; далее инкрементируется (SKU-1000, SKU-1001, ...).</summary>
    private const int FirstSkuNumber = 1000;

    /// <summary>Базовая вероятность отмены до поправок на менеджера и сегмент клиента.</summary>
    private const double BaseCancelledProbability = 0.06;

    /// <summary>Базовая вероятность возврата до поправок на товар и сегмент клиента.</summary>
    private const double BaseRefundedProbability = 0.16;

    /// <summary>Enterprise отменяет реже: корпоративные процедуры, меньше импульсивных отказов.</summary>
    private const double EnterpriseCancelledFactor = 0.7;

    /// <summary>Mid-market — базовый сценарий отмен.</summary>
    private const double MidMarketCancelledFactor = 1.0;

    /// <summary>SMB отменяет чаще: небольшие суммы, быстрые решения.</summary>
    private const double SmbCancelledFactor = 1.3;

    /// <summary>Enterprise возвращает редко; SMB — заметно чаще.</summary>
    private const double EnterpriseRefundedFactor = 0.5;

    /// <summary>Mid-market возвращает чуть реже базового.</summary>
    private const double MidMarketRefundedFactor = 0.9;

    /// <summary>SMB возвращает заметно чаще базового.</summary>
    private const double SmbRefundedFactor = 1.4;

    /// <summary>Множитель потока заказов менеджера-звезды.</summary>
    private const double StarManagerStrength = 2.2;

    /// <summary>Множитель потока заказов слабого менеджера.</summary>
    private const double WeakManagerStrength = 0.4;

    /// <summary>Множитель потока заказов обычного менеджера: базовый уровень.</summary>
    private const double RegularManagerStrength = 1.0;

    /// <summary>Поправка к вероятности отмены: у звёзд сделок до отмены доходит меньше.</summary>
    private const double StarManagerCancelledFactor = 0.8;

    /// <summary>Поправка к вероятности отмены: слабые исполнители отменяют чаще.</summary>
    private const double WeakManagerCancelledFactor = 1.4;

    /// <summary>Поправка к вероятности отмены обычного менеджера: базовый уровень.</summary>
    private const double RegularManagerCancelledFactor = 1.0;

    /// <summary>Период назначения звёзд: каждый 5-й менеджер по индексу (0, 5, 10, ...).</summary>
    private const int StarManagerPeriod = 5;

    /// <summary>Период назначения слабых: каждый 7-й менеджер по индексу (7, 14, ...); индекс 0 уже звезда.</summary>
    private const int WeakManagerPeriod = 7;

    /// <summary>Дешёвый товар возвращают часто: фактор для товара с минимальной ценой.</summary>
    private const double CheapProductRefundFactor = 2.0;

    /// <summary>Премиальный товар возвращают редко: фактор для товара с максимальной ценой.</summary>
    private const double PremiumProductRefundFactor = 0.5;

    /// <summary>
    /// Фиксированная опорная дата генерации; от неё отсчитываются 12 месяцев истории.
    /// Kind=Utc обязателен: Npgsql пишет в timestamptz только UTC-значения.
    /// </summary>
    private static readonly DateTime AnchorDate = new(2026, 10, 3, 0, 0, 0, DateTimeKind.Utc);

    /// <summary>Амплитуда сезонной волны: отклонение потока заказов от базового уровня (±30%).</summary>
    private const double SeasonalAmplitude = 0.3;

    /// <summary>Период сезонной волны в днях: полный год.</summary>
    private const double SeasonPeriodDays = 365.0;

    /// <summary>Множитель потока заказов в выходные: B2B-клиенты работают по будням, поток затухает.</summary>
    private const double WeekendOrdersFactor = 0.4;

    /// <summary>Множитель потока заказов в начале года: старт ниже базового уровня.</summary>
    private const double GrowthStartFactor = 0.8;

    /// <summary>Множитель потока заказов в конце года: год закрывается на подъёме.</summary>
    private const double GrowthEndFactor = 1.2;

    /// <summary>Нижняя граница базового числа заказов в день до сезонных поправок.</summary>
    private const int MinOrdersPerDay = 6;

    /// <summary>Верхняя граница базового числа заказов в день (не включается, как в Random.Next).</summary>
    private const int MaxOrdersPerDay = 14;

    /// <summary>Час создания сделки: начало рабочего окна.</summary>
    private const int BusinessDayStartHour = 8;

    /// <summary>Час создания сделки: конец рабочего окна (не включён).</summary>
    private const int BusinessDayEndHour = 20;

    private static readonly string[] Surnames =
    [
        "Иванов", "Петров", "Сидоров", "Кузнецов", "Смирнов", "Попов", "Волков",
        "Соколов", "Морозов", "Лебедев", "Новиков", "Егоров", "Павлов", "Козлов",
        "Степанов", "Николаев", "Орлов", "Андреев", "Макаров", "Никитин",
    ];

    private static readonly string[] Teams = ["Альфа", "Бета", "Гамма"];

    private static readonly (string Name, decimal BasePrice)[] Catalog =
    [
        ("Дроны", 80_000m),
        ("Ноутбуки", 70_000m),
        ("Смартфоны", 50_000m),
        ("Планшеты", 35_000m),
        ("Фотоаппараты", 65_000m),
        ("Телевизоры", 45_000m),
        ("Наушники", 12_000m),
        ("Умные часы", 18_000m),
        ("Игровые консоли", 40_000m),
        ("Периферия", 8_000m),
        ("Аксессуары", 5_000m),
        ("Серверы", 150_000m),
        ("Сетевое оборудование", 25_000m),
        ("Мониторы", 15_000m),
        ("Принтеры", 10_000m),
        ("3D-принтеры", 55_000m),
        ("Роботы-пылесосы", 20_000m),
        ("Электротранспорт", 90_000m),
        ("Умный дом", 14_000m),
        ("Аудио-системы", 30_000m),
    ];

    public SeedData Create()
    {
        var random = new Random(RandomSeed);
        var start = AnchorDate.AddMonths(-12);

        var categories = CreateCategories();
        var products = CreateProducts(random, categories);
        var managers = CreateManagers();
        var customers = CreateCustomers(random);

        var sales = CreateSales(random, start, AnchorDate, managers, customers, products);

        return new SeedData(managers, customers, categories, products, sales);
    }

    private static List<CategoryEntity> CreateCategories()
        => Catalog.Select(c => new CategoryEntity { Id = Guid.NewGuid(), Name = c.Name }).ToList();

    private static List<ProductEntity> CreateProducts(Random random, List<CategoryEntity> categories)
    {
        var products = new List<ProductEntity>();
        var sku = FirstSkuNumber;

        for (var c = 0; c < categories.Count; c++)
        {
            var category = categories[c];
            var basePrice = Catalog[c].BasePrice;

            for (var i = 1; i <= ProductsPerCategory; i++)
            {
                var price = Math.Round(basePrice * (0.6m + 0.8m * (decimal)random.NextDouble()), 2);
                var cost = Math.Round(price * (0.55m + 0.25m * (decimal)random.NextDouble()), 2);

                products.Add(new ProductEntity
                {
                    Id = Guid.NewGuid(),
                    Name = $"{category.Name} {i}",
                    Sku = $"SKU-{sku++}",
                    CategoryId = category.Id,
                    Category = category,
                    Price = price,
                    Cost = cost,
                });
            }
        }

        return products;
    }

    private static List<ManagerEntity> CreateManagers()
        => Surnames.Select((surname, i) => new ManagerEntity
        {
            Id = Guid.NewGuid(),
            Name = surname,
            Team = Teams[i % Teams.Length],
            Position = "Менеджер",
            Active = true,
            Avatar = null,
            Initials = Initials(surname),
        }).ToList();

    private static List<CustomerEntity> CreateCustomers(Random random)
    {
        var customers = new List<CustomerEntity>();

        for (var i = 1; i <= CustomerCount; i++)
        {
            // 10 Enterprise, 25 Mid-market, остальные SMB — разброс, видимый в средних
            // чеках и размерах сделок (domain.md, «Сегменты клиентов»).
            var segment = i <= EnterpriseCustomerCount
                ? CustomerSegment.Enterprise
                : i <= EnterpriseCustomerCount + MidMarketCustomerCount
                    ? CustomerSegment.MidMarket
                    : CustomerSegment.Smb;

            customers.Add(new CustomerEntity
            {
                Id = Guid.NewGuid(),
                Name = $"Компания {i:D2}",
                Company = $"ООО Компания {i:D2}",
                Segment = segment,
                Since = (short)(2018 + random.Next(0, 8)),
            });
        }

        return customers;
    }

    /// <summary>
    /// Генерирует все сделки за 12 месяцев от start до anchor включительно.
    /// </summary>
    /// <param name="random">Источник случайности; подаётся снаружи, чтобы генерация оставалась детерминированной.</param>
    /// <param name="start">Первый день окна генерации (anchor минус 12 месяцев).</param>
    /// <param name="anchor">Последний день окна генерации (опорная дата AnchorDate); события сделки прижимаются к последнему мгновению этого дня.</param>
    /// <param name="managers">Менеджеры, между которыми распределяются сделки по силе потока заказов.</param>
    /// <param name="customers">Клиенты сделки; сегмент задаёт поправки к вероятностям отмены и возврата.</param>
    /// <param name="products">Товары для позиций сделки; цена товара задаёт поправку к вероятности возврата.</param>
    private static List<SaleEntity> CreateSales(
        Random random,
        DateTime start,
        DateTime anchor,
        List<ManagerEntity> managers,
        List<CustomerEntity> customers,
        List<ProductEntity> products)
    {
        var sales = new List<SaleEntity>();
        var totalDays = (anchor - start).Days;

        // Роли менеджеров: несколько звёзд, несколько слабых исполнителей
        // (domain.md seed brief). Роль задаёт и силу потока заказов, и поправку
        // к вероятности отмены — выводятся из неё в одном месте.
        var managerFactors = managers
            .Select((_, managerIndex) => CreateManagerFactors(ResolveManagerRole(managerIndex)))
            .ToArray();

        // Сила задаёт частоту заказов менеджера; накопленные суммы — для
        // взвешенного выбора исполнителя сделки.
        var managerStrengths = managerFactors
            .Select(factors => factors.Strength)
            .ToArray();

        var managerPickCumulative = BuildManagerPickCumulative(managerStrengths);

        var managerCancelledFactors = managerFactors
            .Select(factors => factors.CancelledFactor)
            .ToArray();

        // Поправки вероятностей исходов: у клиента — по сегменту, у товара —
        // по цене. Словари по Id, чтобы не пересчитывать на каждой сделке.
        var customerFactors = CreateCustomerOutcomeFactors(customers);
        var productRefundFactors = CreateProductRefundFactors(products);

        var lastEventMoment = anchor.AddDays(1).AddTicks(-1);

        // Всё, что нужно генерации одной сделки, собирается в контекст один раз
        // до цикла — внутри цикла только выборки по Id и броски случайности.
        var context = new SaleGenerationContext(
            managers,
            managerPickCumulative,
            managerCancelledFactors,
            customers,
            customerFactors,
            products,
            productRefundFactors,
            lastEventMoment);

        for (var day = 0; day <= totalDays; day++)
        {
            var date = start.AddDays(day);

            // Сезонная волна: поток заказов колеблется вокруг базового уровня
            // с амплитудой SeasonalAmplitude и периодом в год.
            var season = 1 + SeasonalAmplitude * Math.Sin(2 * Math.PI * day / SeasonPeriodDays);

            var weekend = date.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday;
            var weekdayFactor = weekend ? WeekendOrdersFactor : 1.0;

            // Рост в течение года: от GrowthStartFactor в начале окна до
            // GrowthEndFactor в конце, линейно по прогрессу года.
            var yearProgress = day / (double)totalDays;
            var growth = GrowthStartFactor + (GrowthEndFactor - GrowthStartFactor) * yearProgress;

            var orders = (int)Math.Round(
                random.Next(MinOrdersPerDay, MaxOrdersPerDay) * season * weekdayFactor * growth);

            for (var order = 0; order < orders; order++)
            {
                var sale = CreateSale(random, date, context);
                sales.Add(sale);
            }
        }

        return sales;
    }

    /// <summary>
    /// Превращает силы менеджеров в накопленные суммы для взвешенного выбора:
    /// cumulative[i] = сумма сил от 0 до i. Длина отрезка
    /// [cumulative[i-1], cumulative[i]] пропорциональна силе i-го менеджера,
    /// поэтому случайная точка в [0, сумма] с вероятностью
    /// strength/сумма попадает в отрезок любого менеджера (см. PickWeighted).
    /// </summary>
    private static double[] BuildManagerPickCumulative(double[] managerStrengths)
    {
        var cumulative = new double[managerStrengths.Length];

        // running — накопленная сумма сил: после каждой итерации она равна
        // сумме сил менеджеров от первого до i-го включительно.
        var running = 0.0;

        for (var i = 0; i < managerStrengths.Length; i++)
        {
            running += managerStrengths[i];
            cumulative[i] = running;
        }

        return cumulative;
    }

    /// <summary>
    /// Роль менеджера по позиции в списке: каждая StarManagerPeriod-я — звезда,
    /// каждая WeakManagerPeriod-я — слабый, остальные обычные. Звезда имеет
    /// приоритет: индекс 0 кратен обоим периодам, но становится звездой.
    /// </summary>
    private static ManagerRole ResolveManagerRole(int managerIndex)
    {
        if (managerIndex % StarManagerPeriod == 0)
            return ManagerRole.Star;

        return managerIndex % WeakManagerPeriod == 0
            ? ManagerRole.Weak
            : ManagerRole.Regular;
    }

    /// <summary>Сила потока заказов и поправка отмены по роли менеджера.</summary>
    private static ManagerFactors CreateManagerFactors(ManagerRole role)
        => role switch
        {
            ManagerRole.Star => new ManagerFactors(StarManagerStrength, StarManagerCancelledFactor),
            ManagerRole.Weak => new ManagerFactors(WeakManagerStrength, WeakManagerCancelledFactor),
            _ => new ManagerFactors(RegularManagerStrength, RegularManagerCancelledFactor),
        };

    /// <summary>Роль менеджера в сидере: определяет силу потока заказов и поправку отмены.</summary>
    private enum ManagerRole
    {
        Star,
        Weak,
        Regular,
    }

    /// <summary>Характеристики менеджера для генерации сделок.</summary>
    private sealed record ManagerFactors(double Strength, double CancelledFactor);

    /// <summary>Поправки вероятностей исходов для сегмента клиента.</summary>
    private sealed record CustomerOutcomeFactors(double CancelledFactor, double RefundedFactor);

    /// <summary>Всё необходимое для генерации одной продажи.</summary>
    private sealed record SaleGenerationContext(
        List<ManagerEntity> Managers,
        double[] ManagerPickCumulative,
        double[] ManagerCancelledFactors,
        List<CustomerEntity> Customers,
        Dictionary<Guid, CustomerOutcomeFactors> CustomerFactorsByCustomer,
        List<ProductEntity> Products,
        Dictionary<Guid, double> ProductRefundFactorByProduct,
        DateTime LastEventMoment);

    /// <summary>
    /// Поправки по сегменту клиента: Enterprise отменяет реже, но возвращает
    /// чаще, SMB — наоборот (domain.md, «Сегменты клиентов»).
    /// </summary>
    private static Dictionary<Guid, CustomerOutcomeFactors> CreateCustomerOutcomeFactors(
        List<CustomerEntity> customers)
        => customers.ToDictionary(
            customer => customer.Id,
            customer => customer.Segment switch
            {
                CustomerSegment.Enterprise =>
                    new CustomerOutcomeFactors(EnterpriseCancelledFactor, EnterpriseRefundedFactor),
                CustomerSegment.MidMarket =>
                    new CustomerOutcomeFactors(MidMarketCancelledFactor, MidMarketRefundedFactor),
                _ => new CustomerOutcomeFactors(SmbCancelledFactor, SmbRefundedFactor),
            });

    /// <summary>Фактор возврата растёт по мере удешевления товара: премиум возвращают редко, дешёвое — часто.</summary>
    private static Dictionary<Guid, double> CreateProductRefundFactors(List<ProductEntity> products)
    {
        // Границы цен каталога — шкала, по которой нормируется положение товара.
        var minPrice = products.Min(product => product.Price);
        var maxPrice = products.Max(product => product.Price);
        var priceRange = maxPrice - minPrice;

        return products.ToDictionary(
            product => product.Id,
            product =>
            {
                // Положение цены товара на шкале каталога в долях:
                // 0 — самый дешёвый товар, 1 — самый дорогой, 0.5 — середина.
                var priceShare = priceRange == 0
                    ? 0.0
                    : (double)((product.Price - minPrice) / priceRange);

                // Фактор возврата должен убывать с ценой, поэтому шкала
                // переворачивается: у дешёвого товара вклад в возвраты максимален.
                var premiumShare = 1.0 - priceShare;

                // Линейная интерполяция между двумя точками шкалы:
                // дешёвый товар → CheapProductRefundFactor, премиум →
                // PremiumProductRefundFactor, середина — пропорционально.
                var refundFactor = PremiumProductRefundFactor
                    + premiumShare * (CheapProductRefundFactor - PremiumProductRefundFactor);

                return refundFactor;
            });
    }

    private static SaleEntity CreateSale(
        Random random,
        DateTime date,
        SaleGenerationContext context)
    {
        var managerIndex = PickWeighted(random, context.ManagerPickCumulative);
        var manager = context.Managers[managerIndex];
        var customer = context.Customers[random.Next(context.Customers.Count)];
        
        var createdAt = date
            .AddHours(random.Next(BusinessDayStartHour, BusinessDayEndHour))
            .AddMinutes(random.Next(0, 60));

        var items = new List<SaleItemEntity>();
        var itemCount = random.Next(1, 5);

        for (var i = 0; i < itemCount; i++)
        {
            var product = context.Products[random.Next(context.Products.Count)];
            items.Add(new SaleItemEntity
            {
                Id = Guid.NewGuid(),
                ProductId = product.Id,
                Product = product,
                Quantity = random.Next(1, 6),
                SalePrice = Math.Round(product.Price * (0.9m + 0.2m * (decimal)random.NextDouble()), 2),
                UnitCost = product.Cost,
            });
        }

        var sale = new SaleEntity
        {
            Id = Guid.NewGuid(),
            ManagerId = manager.Id,
            Manager = manager,
            CustomerId = customer.Id,
            Customer = customer,
            CreatedAt = createdAt,
        };

        var customerFactors = context.CustomerFactorsByCustomer[customer.Id];

        var cancelledProbability = BaseCancelledProbability
            * context.ManagerCancelledFactors[managerIndex]
            * customerFactors.CancelledFactor;

        var refundedProbability = BaseRefundedProbability
            * customerFactors.RefundedFactor
            * context.ProductRefundFactorByProduct[items[0].ProductId];

        // События, выходящие за окно, прижимаются к его последнему мгновению:
        // каждая сделка получает финальный статус (paid/cancelled/refunded).
        if (random.NextDouble() < cancelledProbability)
        {
            // Отмена: никогда не оплачивается, разрешается только cancelledAt.
            sale.CancelledAt = Min(
                createdAt.AddDays(random.Next(1, 10)),
                context.LastEventMoment);
        }
        else
        {
            sale.PaidAt = Min(
                createdAt.AddDays(random.Next(0, 5)).AddHours(random.Next(1, 48)),
                context.LastEventMoment);

            if (random.NextDouble() < refundedProbability)
            {
                // Возврат: оплата, затем возврат в течение ~45 дней; фактор
                // возврата берём по первому товару сделки.
                sale.RefundedAt = Min(
                    sale.PaidAt.Value.AddDays(random.Next(1, 45)),
                    context.LastEventMoment);
            }
        }

        foreach (var item in items)
            item.Sale = sale;

        sale.Items = items;

        return sale;
    }

    /// <summary>
    /// Выбирает случайный индекс массива cumulative: чем больше разница
    /// cumulative[i] - cumulative[i-1], тем выше вероятность выбрать i.
    /// cumulative — накопленные суммы весов; последний элемент равен сумме
    /// всех весов, поэтому одна случайная точка в [0, сумма] решает выбор.
    /// </summary>
    private static int PickWeighted(Random random, double[] cumulative)
    {
        // Случайная точка на оси [0, сумма всех весов]: куда попадёт — тот
        // отрезок (и соответствующий менеджер) и выпадет.
        var target = random.NextDouble() * cumulative[^1];

        for (var i = 0; i < cumulative.Length; i++)
        {
            // Первый отрезок, чей правый край накрыл точку, и есть выбор:
            // вероятность попадания в отрезок = его длина / сумма весов.
            if (target <= cumulative[i])
                return i;
        }

        // Страховка от погрешностей double: точка строго правее последнего
        // края считается выпавшей на последний отрезок.
        return cumulative.Length - 1;
    }

    private static DateTime Min(DateTime value, DateTime ceiling)
        => value > ceiling ? ceiling : value;

    private static string Initials(string name)
    {
        var parts = name.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var initials = string.Concat(parts.Take(2).Select(p => char.ToUpperInvariant(p[0])));

        return initials;
    }
}
