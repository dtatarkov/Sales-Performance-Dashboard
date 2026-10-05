namespace SalesDashboard.Infrastructure.Persistence;

/// <summary>
/// Сделка (db.md, sales): created_at обязателен, три даты событий nullable;
/// статус выводится из дат, нигде не хранится (domain.md, «Жизненный цикл сделки»).
/// </summary>
public sealed class SaleEntity
{
    public Guid Id { get; set; }
    public Guid ManagerId { get; set; }    
    public Guid CustomerId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? PaidAt { get; set; }
    public DateTime? RefundedAt { get; set; }
    public DateTime? CancelledAt { get; set; }

    public ManagerEntity Manager { get; set; } = null!;
    public CustomerEntity Customer { get; set; } = null!;
    public ICollection<SaleItemEntity> Items { get; set; } = new List<SaleItemEntity>();
}
