namespace SalesDashboard.Domain;

/// <summary>
/// Статус строки продажи. Числовые значения — часть публичного контракта API, менять их нельзя (api.md).
/// </summary>
public enum SaleStatus
{
    Paid = 1,
    Refunded = 2,
    Cancelled = 3,
}
