using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace SalesDashboard.Infrastructure.Persistence;

/// <summary>
/// Маппинг таблицы managers (db.md): строковые поля с ограничениями длины,
/// дефолт active = true. Индексов сверх PK не требуется — реестр маленький.
/// </summary>
public sealed class ManagerConfiguration : IEntityTypeConfiguration<ManagerEntity>
{
    public void Configure(EntityTypeBuilder<ManagerEntity> builder)
    {
        builder.ToTable("managers");
        builder.HasKey(m => m.Id);
        builder.Property(m => m.Id).HasColumnName("id");
        builder.Property(m => m.Name).HasColumnName("name").HasMaxLength(200).IsRequired();
        builder.Property(m => m.Team).HasColumnName("team").HasMaxLength(100).IsRequired();
        builder.Property(m => m.Position).HasColumnName("position").HasMaxLength(100).IsRequired();
        builder.Property(m => m.Active).HasColumnName("active").HasDefaultValue(true).IsRequired();
        builder.Property(m => m.Avatar).HasColumnName("avatar").HasMaxLength(500);
        builder.Property(m => m.Initials).HasColumnName("initials").HasMaxLength(10).IsRequired();
    }
}
