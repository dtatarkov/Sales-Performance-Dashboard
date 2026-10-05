using Microsoft.EntityFrameworkCore;

namespace SalesDashboard.Infrastructure.Persistence;

/// <summary>
/// Read-only контекст дашборда (backend.md §5.2). Владеет шестью таблицами db.md;
/// порты чтения запрашивают его с <c>AsNoTracking</c>, seed пишет через него.
/// </summary>
public sealed class SalesDbContext(DbContextOptions<SalesDbContext> options) : DbContext(options)
{
    public DbSet<ManagerEntity> Managers => Set<ManagerEntity>();
    public DbSet<CustomerEntity> Customers => Set<CustomerEntity>();
    public DbSet<CategoryEntity> Categories => Set<CategoryEntity>();
    public DbSet<ProductEntity> Products => Set<ProductEntity>();
    public DbSet<SaleEntity> Sales => Set<SaleEntity>();
    public DbSet<SaleItemEntity> SaleItems => Set<SaleItemEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(SalesDbContext).Assembly);
    }
}
