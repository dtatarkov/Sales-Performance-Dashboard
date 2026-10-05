namespace SalesDashboard.Infrastructure.Persistence;

/// <summary>Категория товара (db.md, categories); имя уникально.</summary>
public sealed class CategoryEntity
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;

    public ICollection<ProductEntity> Products { get; set; } = new List<ProductEntity>();
}
