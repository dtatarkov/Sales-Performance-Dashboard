namespace SalesDashboard.Domain;

/// <summary>
/// Единица измерения дельты между периодами. Числовые значения — часть
/// публичного контракта API, менять их нельзя (api.md: Percent=1 → суффикс "%", Pp=2 → "п.п.").
/// </summary>
public enum DeltaUnit
{
    Percent = 1,
    Pp = 2,
}
