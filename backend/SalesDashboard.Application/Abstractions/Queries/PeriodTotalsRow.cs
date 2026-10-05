namespace SalesDashboard.Application.Abstractions.Queries;

/// <summary>
/// Сырые итоги одного периода: оплаченная когорта плюс отмены по дате события
/// (domain.md, «Роли дат»). Только деньги и количества — каждое отношение, Δ и
/// доля выводятся в домене, никогда здесь.
/// </summary>
/// <param name="Revenue">Чистая выручка: оплаченные строки, чья оплата держится (возвраты исключены).</param>
/// <param name="Cost">Себестоимость ровно тех чистых строк.</param>
/// <param name="PaidCount">Продажи, оплаченные в окне, включая позже возвращённые.</param>
/// <param name="RefundedCount">Из <paramref name="PaidCount"/> — те, что в итоге возвращены.</param>
/// <param name="CancelledCount">Продажи, отменённые по <c>cancelledAt</c> в окне.</param>
public sealed record PeriodTotalsRow(
    decimal Revenue,
    decimal Cost,
    int PaidCount,
    int RefundedCount,
    int CancelledCount);
