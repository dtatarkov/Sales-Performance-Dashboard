using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace SalesDashboard.Infrastructure.Persistence;

/// <summary>
/// Маппинг таблицы products (db.md): справочник с ценой/себестоимостью каталога;
/// уникальный sku, ссылка на категорию без каскада.
/// </summary>
public sealed class ProductConfiguration : IEntityTypeConfiguration<ProductEntity>
{
    public void Configure(EntityTypeBuilder<ProductEntity> builder)
    {
        builder.ToTable("products");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).HasColumnName("id");
        builder.Property(p => p.Name).HasColumnName("name").HasMaxLength(300).IsRequired();
        builder.Property(p => p.Sku).HasColumnName("sku").HasMaxLength(50).IsRequired();
        builder.Property(p => p.CategoryId).HasColumnName("category_id").IsRequired();
        builder.Property(p => p.Price).HasColumnName("price").HasColumnType("numeric(18,2)").IsRequired();
        builder.Property(p => p.Cost).HasColumnName("cost").HasColumnType("numeric(18,2)").IsRequired();

        builder.HasOne(p => p.Category)
            .WithMany(c => c.Products)
            .HasForeignKey(p => p.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(p => p.Sku).IsUnique().HasDatabaseName("ix_products_sku");

        // Примечание: EF добавляет IX_products_category_id для FK по конвенции; db.md
        // считает его ненужным (маленькая таблица, hash-join сторона), но он
        // безвреден и не подавляется без кастомной конвенции.
    }
}
