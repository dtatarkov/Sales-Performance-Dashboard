using Microsoft.EntityFrameworkCore;
using SalesDashboard.Infrastructure.Persistence;

namespace SalesDashboard.Infrastructure.Seed;

/// <summary>«Что и как сохранять» (backend.md §5.4).</summary>
public interface IDataSeeder
{
    Task SeedAsync(CancellationToken cancellationToken = default);
}

/// <summary>
/// Сохраняет сгенерированный граф данных. Идемпотентен по наличию продаж:
/// непустая таблица <c>sales</c> означает, что база уже заполнена.
/// </summary>
public sealed class DatabaseSeeder(SalesDbContext db, SeedDataFactory factory) : IDataSeeder
{
    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        if (await db.Sales.AnyAsync(cancellationToken))
            return;

        var data = factory.Create();

        db.Managers.AddRange(data.Managers);
        db.Customers.AddRange(data.Customers);
        db.Categories.AddRange(data.Categories);
        db.Products.AddRange(data.Products);
        db.Sales.AddRange(data.Sales);

        await db.SaveChangesAsync(cancellationToken);
    }
}
