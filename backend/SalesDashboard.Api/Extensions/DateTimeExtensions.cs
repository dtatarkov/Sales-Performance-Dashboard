namespace SalesDashboard.Api.Extensions;

/// <summary>
/// Расширения <see cref="DateTime"/> для приведения дат API-контракта к UTC.
/// </summary>
public static class DateTimeExtensions
{
    /// <summary>
    /// Все даты контракта — UTC; значение без явного Kind трактуется как UTC,
    /// чтобы не отклонять корректный запрос на технической детали.
    /// </summary>
    public static DateTime AsUtc(this DateTime value)
        => value.Kind == DateTimeKind.Utc ? value : DateTime.SpecifyKind(value, DateTimeKind.Utc);
}
