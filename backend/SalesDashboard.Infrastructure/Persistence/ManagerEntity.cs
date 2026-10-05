namespace SalesDashboard.Infrastructure.Persistence;

/// <summary>Реестр менеджеров (db.md, таблица managers); пишет только seed.</summary>
public sealed class ManagerEntity
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string Team { get; set; } = null!;
    public string Position { get; set; } = null!;
    public bool Active { get; set; } = true;
    public string? Avatar { get; set; }
    public string Initials { get; set; } = null!;

    public ICollection<SaleEntity> Sales { get; set; } = new List<SaleEntity>();
}
