using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace SalesDashboard.Infrastructure.Persistence;

/// <summary>
/// Design-time фабрика, чтобы <c>dotnet ef migrations</c> мог построить контекст
/// без Api-хоста. Строка подключения нужна только для генерации SQL — для
/// скаффолдинга миграции соединение с БД не открывается.
/// </summary>
public sealed class SalesDbContextFactory : IDesignTimeDbContextFactory<SalesDbContext>
{
    public SalesDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__Postgres")
            ?? "Host=localhost;Port=5432;Database=sales_dashboard;Username=postgres;Password=postgres";

        var options = new DbContextOptionsBuilder<SalesDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        return new SalesDbContext(options);
    }
}
