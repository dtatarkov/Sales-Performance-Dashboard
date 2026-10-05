using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace SalesDashboard.Infrastructure.Persistence;

/// <summary>
/// Маппинг таблицы customers (db.md): сегмент — numeric enum (smallint), год
/// «с нами с» — smallint без типа DateTime.
/// </summary>
public sealed class CustomerConfiguration : IEntityTypeConfiguration<CustomerEntity>
{
    public void Configure(EntityTypeBuilder<CustomerEntity> builder)
    {
        builder.ToTable("customers");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasColumnName("id");
        builder.Property(c => c.Name).HasColumnName("name").HasMaxLength(200).IsRequired();
        builder.Property(c => c.Company).HasColumnName("company").HasMaxLength(200).IsRequired();
        builder.Property(c => c.Segment).HasColumnName("segment").HasConversion<short>().HasColumnType("smallint").IsRequired();
        builder.Property(c => c.Since).HasColumnName("since").HasColumnType("smallint").IsRequired();

        // Глобальный фильтр по сегменту выполняется на каждом запросе дашборда (db.md).
        builder.HasIndex(c => c.Segment).HasDatabaseName("ix_customers_segment");
    }
}
