using Microsoft.EntityFrameworkCore;
using SalesDashboard.Infrastructure.Persistence;

namespace SalesDashboard.Infrastructure.Seed;

/// <summary>
/// Стартовый хук (backend.md §5.4): применяет миграции, затем передаёт управление
/// сидеру. Сам данные ни генерирует, ни сохраняет. Идемпотентен: уже засеянная
/// база остаётся без изменений.
/// </summary>
public sealed class DatabaseInitializer(SalesDbContext db, IDataSeeder seeder)
{
    public async Task InitializeDatabaseAsync(CancellationToken cancellationToken = default)
    {
        await db.Database.MigrateAsync(cancellationToken);
        await seeder.SeedAsync(cancellationToken);
    }
}
