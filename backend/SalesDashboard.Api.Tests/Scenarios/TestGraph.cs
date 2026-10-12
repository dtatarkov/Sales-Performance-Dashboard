using Microsoft.EntityFrameworkCore;
using SalesDashboard.Domain;
using SalesDashboard.Infrastructure.Persistence;

namespace SalesDashboard.Api.Tests.Scenarios;

/// <summary>
/// Спецификация одной позиции сделки: товар, количество и замороженные на
/// момент сделки цена продажи и себестоимость единицы.
/// </summary>
/// <param name="Product">Товар позиции.</param>
/// <param name="Quantity">Количество единиц (больше нуля).</param>
/// <param name="SalePrice">Цена продажи за единицу.</param>
/// <param name="UnitCost">Себестоимость единицы.</param>
public sealed record SaleItemSpec(ProductEntity Product, int Quantity, decimal SalePrice, decimal UnitCost);

/// <summary>
/// Конструктор данных одного тестового мира: наполняет справочники и сделки с
/// детерминированным содержимым и сохраняет граф одним <c>SaveChanges</c>.
/// Все даты — фиксированные UTC-константы сценария; серверного «сейчас» мир не
/// знает, поэтому каждый запрос периодом/сегментом сам выбирает срез данных.
/// </summary>
public sealed class TestGraph(DbContextOptions<SalesDbContext> options)
{
    private readonly List<ManagerEntity> _managers = [];
    private readonly List<CustomerEntity> _customers = [];
    private readonly List<CategoryEntity> _categories = [];
    private readonly List<ProductEntity> _products = [];
    private readonly List<SaleEntity> _sales = [];

    /// <summary>Менеджеры мира — для ассертов по Id/имени.</summary>
    public IReadOnlyList<ManagerEntity> Managers => _managers;

    /// <summary>Клиенты мира — для ассертов по Id/имени.</summary>
    public IReadOnlyList<CustomerEntity> Customers => _customers;

    /// <summary>Категории мира — для ассертов по Id/имени.</summary>
    public IReadOnlyList<CategoryEntity> Categories => _categories;

    /// <summary>Товары мира — для ассертов по Id/имени.</summary>
    public IReadOnlyList<ProductEntity> Products => _products;

    /// <summary>Сделки мира — для ассертов по Id и статусам.</summary>
    public IReadOnlyList<SaleEntity> Sales => _sales;

    /// <summary>
    /// Добавляет менеджера в реестр мира.
    /// </summary>
    /// <param name="name">Полное имя (участвует в tie-break по имени).</param>
    /// <param name="initials">Инициалы (фолбэк аватара).</param>
    /// <param name="team">Команда.</param>
    /// <returns>Созданная сущность.</returns>
    public ManagerEntity AddManager(string name, string initials, string team)
    {
        var manager = new ManagerEntity
        {
            Id = Guid.NewGuid(),
            Name = name,
            Team = team,
            Position = "Менеджер",
            Active = true,
            Avatar = null,
            Initials = initials,
        };

        _managers.Add(manager);

        return manager;
    }

    /// <summary>
    /// Добавляет клиента в реестр мира.
    /// </summary>
    /// <param name="name">Название клиента (участвует в tie-break по имени).</param>
    /// <param name="company">Юридическое название.</param>
    /// <param name="segment">Сегмент клиента.</param>
    /// <param name="since">Год начала работы.</param>
    /// <returns>Созданная сущность.</returns>
    public CustomerEntity AddCustomer(string name, string company, CustomerSegment segment, short since)
    {
        var customer = new CustomerEntity
        {
            Id = Guid.NewGuid(),
            Name = name,
            Company = company,
            Segment = segment,
            Since = since,
        };

        _customers.Add(customer);

        return customer;
    }

    /// <summary>
    /// Добавляет категорию товаров в реестр мира.
    /// </summary>
    /// <param name="name">Название категории (уникально в мире).</param>
    /// <returns>Созданная сущность.</returns>
    public CategoryEntity AddCategory(string name)
    {
        var category = new CategoryEntity
        {
            Id = Guid.NewGuid(),
            Name = name,
        };

        _categories.Add(category);

        return category;
    }

    /// <summary>
    /// Добавляет товар в реестр мира. Справочные цена/себестоимость — только
    /// колонки каталога: метрики считаются из замороженных цен позиций.
    /// </summary>
    /// <param name="name">Название товара.</param>
    /// <param name="sku">Артикул (уникален в мире).</param>
    /// <param name="category">Категория товара.</param>
    /// <param name="price">Справочная цена продажи.</param>
    /// <param name="cost">Справочная себестоимость.</param>
    /// <returns>Созданная сущность.</returns>
    public ProductEntity AddProduct(string name, string sku, CategoryEntity category, decimal price, decimal cost)
    {
        var product = new ProductEntity
        {
            Id = Guid.NewGuid(),
            Name = name,
            Sku = sku,
            CategoryId = category.Id,
            Price = price,
            Cost = cost,
        };

        _products.Add(product);

        return product;
    }

    /// <summary>
    /// Добавляет оплаченную сделку: createdAt = paidAt, статус — Paid.
    /// </summary>
    /// <param name="manager">Менеджер сделки.</param>
    /// <param name="customer">Клиент сделки.</param>
    /// <param name="paidAt">Момент оплаты (UTC).</param>
    /// <param name="items">Позиции сделки.</param>
    /// <returns>Созданная сущность.</returns>
    public SaleEntity AddPaidSale(ManagerEntity manager, CustomerEntity customer, DateTime paidAt, params SaleItemSpec[] items)
        => AddSale(manager, customer, paidAt, null, null, items);

    /// <summary>
    /// Добавляет возвращённую сделку: paidAt задан, refundedAt задан, статус — Refunded.
    /// </summary>
    /// <param name="manager">Менеджер сделки.</param>
    /// <param name="customer">Клиент сделки.</param>
    /// <param name="paidAt">Момент оплаты (UTC, до refundedAt).</param>
    /// <param name="refundedAt">Момент возврата (UTC).</param>
    /// <param name="items">Позиции сделки.</param>
    /// <returns>Созданная сущность.</returns>
    public SaleEntity AddRefundedSale(
        ManagerEntity manager,
        CustomerEntity customer,
        DateTime paidAt,
        DateTime refundedAt,
        params SaleItemSpec[] items)
        => AddSale(manager, customer, paidAt, refundedAt, null, items);

    /// <summary>
    /// Добавляет отменённую сделку без оплаты: cancelledAt задан, статус — Cancelled.
    /// </summary>
    /// <param name="manager">Менеджер сделки.</param>
    /// <param name="customer">Клиент сделки.</param>
    /// <param name="cancelledAt">Момент отмены (UTC).</param>
    /// <param name="items">Позиции сделки.</param>
    /// <returns>Созданная сущность.</returns>
    public SaleEntity AddCancelledSale(
        ManagerEntity manager,
        CustomerEntity customer,
        DateTime cancelledAt,
        params SaleItemSpec[] items)
        => AddSale(manager, customer, null, null, cancelledAt, items);

    /// <summary>
    /// Сохраняет весь граф мира одной транзакцией в БД сценария.
    /// </summary>
    public async Task SaveAsync()
    {
        await using var db = new SalesDbContext(options);

        db.Managers.AddRange(_managers);
        db.Customers.AddRange(_customers);
        db.Categories.AddRange(_categories);
        db.Products.AddRange(_products);
        db.Sales.AddRange(_sales);

        await db.SaveChangesAsync();
    }

    /// <summary>
    /// Собирает сделку по матрице статусов db.md: три nullable-даты событий.
    /// </summary>
    /// <param name="manager">Менеджер сделки.</param>
    /// <param name="customer">Клиент сделки.</param>
    /// <param name="paidAt">Дата оплаты или null.</param>
    /// <param name="refundedAt">Дата возврата или null.</param>
    /// <param name="cancelledAt">Дата отмены или null.</param>
    /// <param name="items">Позиции сделки.</param>
    /// <returns>Созданная сущность.</returns>
    private SaleEntity AddSale(
        ManagerEntity manager,
        CustomerEntity customer,
        DateTime? paidAt,
        DateTime? refundedAt,
        DateTime? cancelledAt,
        SaleItemSpec[] items)
    {
        // Единственное обязательное событие: сделка разрешается оплатой или отменой.
        var createdAt = paidAt ?? cancelledAt ?? throw new ArgumentException("Sale requires paidAt or cancelledAt.", nameof(paidAt));

        RequireUtc(createdAt);
        RequireUtc(refundedAt);
        RequireUtc(cancelledAt);

        var sale = new SaleEntity
        {
            Id = Guid.NewGuid(),
            ManagerId = manager.Id,
            CustomerId = customer.Id,
            CreatedAt = createdAt,
            PaidAt = paidAt,
            RefundedAt = refundedAt,
            CancelledAt = cancelledAt,
        };

        foreach (var spec in items)
        {
            sale.Items.Add(new SaleItemEntity
            {
                Id = Guid.NewGuid(),
                SaleId = sale.Id,
                ProductId = spec.Product.Id,
                Quantity = spec.Quantity,
                SalePrice = spec.SalePrice,
                UnitCost = spec.UnitCost,
            });
        }

        _sales.Add(sale);

        return sale;
    }

    /// <summary>
    /// Защита от не-UTC дат: полуинтервалы и timestamptz предполагают UTC,
    /// локальная дата в seed привела бы к тихому сдвигу бакетов.
    /// </summary>
    /// <param name="moment">Проверяемая дата или null.</param>
    private static void RequireUtc(DateTime? moment)
    {
        if (moment is not null && moment.Value.Kind != DateTimeKind.Utc)
            throw new ArgumentException("Seed dates must be UTC.", nameof(moment));
    }
}
