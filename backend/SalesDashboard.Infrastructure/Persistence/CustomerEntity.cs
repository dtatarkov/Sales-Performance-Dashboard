using SalesDashboard.Domain;

namespace SalesDashboard.Infrastructure.Persistence;

/// <summary>Клиент со справочным сегментом и годом «с нами с» (db.md, customers).</summary>
public sealed class CustomerEntity
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string Company { get; set; } = null!;
    public CustomerSegment Segment { get; set; }
    public short Since { get; set; }

    public ICollection<SaleEntity> Sales { get; set; } = new List<SaleEntity>();
}
