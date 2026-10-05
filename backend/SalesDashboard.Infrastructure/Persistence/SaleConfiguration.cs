using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace SalesDashboard.Infrastructure.Persistence;

/// <summary>
/// Маппинг таблицы sales (db.md): три nullable даты событий (оплата/возврат/
/// отмена) и пять индексов под разрезы дашборда — когорта, менеджеры, клиенты,
/// частичные окна потерь.
/// </summary>
public sealed class SaleConfiguration : IEntityTypeConfiguration<SaleEntity>
{
    public void Configure(EntityTypeBuilder<SaleEntity> builder)
    {
        builder.ToTable("sales");
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).HasColumnName("id");
        builder.Property(s => s.ManagerId).HasColumnName("manager_id").IsRequired();
        builder.Property(s => s.CustomerId).HasColumnName("customer_id").IsRequired();
        builder.Property(s => s.CreatedAt).HasColumnName("created_at").HasColumnType("timestamptz").IsRequired();
        builder.Property(s => s.PaidAt).HasColumnName("paid_at").HasColumnType("timestamptz");
        builder.Property(s => s.RefundedAt).HasColumnName("refunded_at").HasColumnType("timestamptz");
        builder.Property(s => s.CancelledAt).HasColumnName("cancelled_at").HasColumnType("timestamptz");

        builder.HasOne(s => s.Manager)
            .WithMany(m => m.Sales)
            .HasForeignKey(s => s.ManagerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.Customer)
            .WithMany(c => c.Sales)
            .HasForeignKey(s => s.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        // Главная оплачиваемая когорта: index-only scan для KPI, рядов, агрегатов по
        // менеджерам/клиентам и знаменателя доли отмен (db.md).
        builder.HasIndex(s => s.PaidAt)
            .HasDatabaseName("ix_sales_paid_at")
            .IncludeProperties(s => new { s.ManagerId, s.CustomerId, s.RefundedAt });

        // Разрезы рейтингов: агрегаты группируются по исполнителю/клиенту
        // внутри окна paid_at — составной порядок ключа совпадает с запросом.
        builder.HasIndex(s => new { s.ManagerId, s.PaidAt })
            .HasDatabaseName("ix_sales_manager_paid");

        builder.HasIndex(s => new { s.CustomerId, s.PaidAt })
            .HasDatabaseName("ix_sales_customer_paid");

        // Частичные индексы потерь: окна возвратов/отмен читают только строки
        // с датой события, поэтому фильтр IS NOT NULL отсекает 90%+ таблицы (db.md).
        builder.HasIndex(s => s.RefundedAt)
            .HasDatabaseName("ix_sales_refunded_at")
            .HasFilter("refunded_at IS NOT NULL")
            .IncludeProperties(s => s.Id);

        builder.HasIndex(s => s.CancelledAt)
            .HasDatabaseName("ix_sales_cancelled_at")
            .HasFilter("cancelled_at IS NOT NULL")
            .IncludeProperties(s => new { s.Id, s.ManagerId });
    }
}
