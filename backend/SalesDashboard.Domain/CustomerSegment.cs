namespace SalesDashboard.Domain;

/// <summary>
/// Сегмент клиентов по размеру бизнеса, используемый для фильтрации наборов
/// данных дашборда. Числовые значения — часть публичного контракта API,
/// менять их нельзя.
///
/// SMB — small and medium business, малый и средний бизнес (частые мелкие
/// сделки, низкий средний чек — domain.md).
/// </summary>
public enum CustomerSegment
{
    Enterprise = 1,
    MidMarket = 2,
    Smb = 3,
}
