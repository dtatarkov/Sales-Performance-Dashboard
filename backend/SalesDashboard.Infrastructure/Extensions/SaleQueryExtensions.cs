using SalesDashboard.Application.Abstractions.Queries;
using SalesDashboard.Domain;
using SalesDashboard.Infrastructure.Persistence;

namespace SalesDashboard.Infrastructure.Extensions;

/// <summary>
/// Общие фрагменты запросов для read-адаптеров. Задачи разделены:
/// ApplyReadFilter применяет ReadFilter (опциональный сегмент), In-методы
/// отбирают записи по дате в полуоткрытом окне. Фильтр живёт здесь в одном
/// месте, и ни один порт не может незаметно его расширить (backend.md §4.3).
/// </summary>
internal static class SaleQueryExtensions
{
    /// <summary>Отбирает продажи по сегменту клиента; сегмент null — без отбора. Деталь композиции, наружу — только In-методы.</summary>
    private static IQueryable<SaleEntity> FilterBySegment(this IQueryable<SaleEntity> sales, CustomerSegment? segment)
        => segment is null
            ? sales
            : sales.Where(s => s.Customer.Segment == segment);

    /// <summary>Применяет ReadFilter целиком (сегмент; окно дат отбирают In-методы).</summary>
    private static IQueryable<SaleEntity> ApplyReadFilter(this IQueryable<SaleEntity> sales, ReadFilter filter)
        => sales.FilterBySegment(filter.Segment);

    /// <summary>Оплаченная когорта: продажи, у которых <c>paidAt</c> попадает в полуоткрытое окно.</summary>
    internal static IQueryable<SaleEntity> InPaidCohort(this IQueryable<SaleEntity> sales, ReadFilter filter)
        => sales.ApplyReadFilter(filter)
            .Where(s => s.PaidAt >= filter.Period.From && s.PaidAt < filter.Period.To);

    /// <summary>События отмен: <c>cancelledAt</c> внутри полуоткрытого окна.</summary>
    internal static IQueryable<SaleEntity> InCancelledWindow(this IQueryable<SaleEntity> sales, ReadFilter filter)
        => sales.ApplyReadFilter(filter)
            .Where(s => s.CancelledAt >= filter.Period.From && s.CancelledAt < filter.Period.To);

    /// <summary>События возвратов: <c>refundedAt</c> внутри полуоткрытого окна.</summary>
    internal static IQueryable<SaleEntity> InRefundedWindow(this IQueryable<SaleEntity> sales, ReadFilter filter)
        => sales.ApplyReadFilter(filter)
            .Where(s => s.RefundedAt >= filter.Period.From && s.RefundedAt < filter.Period.To);
}
