namespace SalesDashboard.Infrastructure.Persistence;

/// <summary>Товар каталога (db.md, products); сегментируется категорией.</summary>
public sealed class ProductEntity
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string Sku { get; set; } = null!;
    public Guid CategoryId { get; set; }
    public CategoryEntity Category { get; set; } = null!;

    /// <summary>Каталожная цена — в метриках не участвует (db.md).</summary>
    public decimal Price { get; set; }

    /// <summary>Каталожная себестоимость — в метриках не участвует (db.md).</summary>
    public decimal Cost { get; set; }

    public ICollection<SaleItemEntity> SaleItems { get; set; } = new List<SaleItemEntity>();
}
