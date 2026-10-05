using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace SalesDashboard.Infrastructure.Persistence;

/// <summary>
/// Маппинг таблицы sale_items (db.md): позиции сделки с замороженными ценой и
/// себестоимостью; quantity проверяется CHECK-ограничением, удаление — только
/// каскадом от сделки.
/// </summary>
public sealed class SaleItemConfiguration : IEntityTypeConfiguration<SaleItemEntity>
{
    public void Configure(EntityTypeBuilder<SaleItemEntity> builder)
    {
        builder.ToTable("sale_items");
        builder.HasKey(i => i.Id);
        builder.Property(i => i.Id).HasColumnName("id");
        builder.Property(i => i.SaleId).HasColumnName("sale_id").IsRequired();
        builder.Property(i => i.ProductId).HasColumnName("product_id").IsRequired();
        builder.Property(i => i.Quantity).HasColumnName("quantity").IsRequired();
        builder.Property(i => i.SalePrice).HasColumnName("sale_price").HasColumnType("numeric(18,2)").IsRequired();
        builder.Property(i => i.UnitCost).HasColumnName("unit_cost").HasColumnType("numeric(18,2)").IsRequired();

        builder.ToTable(t => t.HasCheckConstraint("ck_sale_items_quantity_positive", "quantity > 0"));

        builder.HasOne(i => i.Sale)
            .WithMany(s => s.Items)
            .HasForeignKey(i => i.SaleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(i => i.Product)
            .WithMany(p => p.SaleItems)
            .HasForeignKey(i => i.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        // Самое горячее соединение дашборда — покрывающий index-only scan (db.md).
        builder.HasIndex(i => i.SaleId)
            .HasDatabaseName("ix_sale_items_sale_id")
            .IncludeProperties(i => new { i.ProductId, i.Quantity, i.SalePrice, i.UnitCost });

        // Разрез «возвраты по товарам» группирует позиции по товару.
        builder.HasIndex(i => i.ProductId)
            .HasDatabaseName("ix_sale_items_product_id");
    }
}
