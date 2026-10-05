namespace SalesDashboard.Infrastructure.Persistence;

/// <summary>Позиция сделки (db.md, sale_items) с замороженными на момент сделки ценой и себестоимостью.</summary>
public sealed class SaleItemEntity
{
    public Guid Id { get; set; }
    public Guid SaleId { get; set; }    
    public Guid ProductId { get; set; }    

    public int Quantity { get; set; }

    /// <summary>Цена продажи за единицу, зафиксированная на момент сделки.</summary>
    public decimal SalePrice { get; set; }

    /// <summary>Себестоимость единицы, зафиксированная на момент сделки.</summary>
    public decimal UnitCost { get; set; }

    public SaleEntity Sale { get; set; } = null!;
    public ProductEntity Product { get; set; } = null!;
}
