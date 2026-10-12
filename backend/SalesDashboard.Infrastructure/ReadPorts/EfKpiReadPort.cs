using Microsoft.EntityFrameworkCore;
using SalesDashboard.Application.Abstractions.Queries;
using SalesDashboard.Infrastructure.Extensions;
using SalesDashboard.Infrastructure.Persistence;

namespace SalesDashboard.Infrastructure.ReadPorts;

/// <summary>
/// Источник KPI (backend.md §5.3): итоги периода и ряд по бакетам оплачиваемой
/// когорты. SQL считает только сырые суммы и счётчики — отношения и Δ остаются
/// в домене.
/// </summary>
public sealed class EfKpiReadPort(SalesDbContext db) : IKpiReadPort
{
    public async Task<PeriodTotalsRow> ReadTotalsAsync(ReadFilter filter, CancellationToken cancellationToken)
    {
        // Берём оплаченную когорту периода из контекста БД.
        // AsNoTracking отключает трекинг изменений — read-only операция.
        // InPaidCohort — extension-метод, фильтрует по paid_at и сегменту.
        var paid = db.Sales.AsNoTracking().InPaidCohort(filter);

        // Формируем набор невозвращённых позиций для расчёта выручки и себестоимости.
        // Where(s => s.RefundedAt == null) отбрасывает позиции из возвращённых сделок.
        // SelectMany(s => s.Items) разворачивает коллекции Items в плоский поток позиций.
        var netItems = paid.Where(s => s.RefundedAt == null).SelectMany(s => s.Items);

        // Считаем выручку как сумму произведений SalePrice × Quantity по всем позициям.
        // Преобразование к decimal? нужно для корректной обработки пустой выборки.
        // Оператор ?? 0m подставляет ноль, если выборка пуста (SUM по пустому = NULL).
        var revenue = await netItems.SumAsync(i => (decimal?)(i.SalePrice * i.Quantity), cancellationToken) ?? 0m;

        // Аналогично считаем себестоимость как сумму UnitCost × Quantity.
        var cost = await netItems.SumAsync(i => (decimal?)(i.UnitCost * i.Quantity), cancellationToken) ?? 0m;

        // Подсчитываем общее число оплаченных сделок в когорте.
        // Это знаменатель для среднего чека и доли возвратов.
        var paidCount = await paid.CountAsync(cancellationToken);

        // Считаем число возвращённых сделок внутри оплаченной когорты.
        // Условие RefundedAt != null идентифицирует возвраты.
        var refundedCount = await paid.CountAsync(s => s.RefundedAt != null, cancellationToken);

        // Отмены берутся из отдельного окна по cancelledAt.
        // Это другой набор данных, чем paid cohort — сделка может быть отменена до оплаты.
        var cancelledCount = await db.Sales.AsNoTracking().InCancelledWindow(filter).CountAsync(cancellationToken);

        // Собираем итоговую строку с пятью метриками периода.
        return new PeriodTotalsRow(revenue, cost, paidCount, refundedCount, cancelledCount);
    }

    public async Task<IReadOnlyList<DailyAggregateRow>> ReadDailyAsync(ReadFilter filter, CancellationToken cancellationToken)
    {
        // Берём оплаченную когорту периода — общая база для обоих запросов.
        var paid = db.Sales.AsNoTracking().InPaidCohort(filter);

        // Группируем оплаченные сделки по паре (день, час) оплаты: оба поля
        // транслируются в SQL на любом провайдере, а бакет-ключ строки
        // собирается ниже в памяти от начала периода
        // (SeriesBuckets, api.md SeriesPointDto).
        var stepHours = SeriesBuckets.StepHoursOf(filter.Period);

        // Это отдельный запрос от денег, чтобы не размножить строки при JOIN с Items.
        var counts = await paid
            .GroupBy(s => new { Date = s.PaidAt!.Value.Date, Hour = s.PaidAt!.Value.Hour })
            .Select(g => new { g.Key.Date, g.Key.Hour, Count = g.Count() })
            .ToListAsync(cancellationToken);

        // Разворачиваем сделки до позиций с флагом возврата и датой.
        // from s in paid — итерируем по оплаченным сделкам.
        // from i in s.Items — вложенная итерация по позициям каждой сделки.
        // Проецируем день/час, статус возврата и финансовые поля позиций.
        var itemRows = from s in paid
                       from i in s.Items
                       select new
                       {
                           s.PaidAt!.Value.Date,
                           s.PaidAt!.Value.Hour,
                           s.RefundedAt,
                           i.Quantity,
                           i.SalePrice,
                           i.UnitCost,
                       };

        // Группируем позиции по паре (день, час).
        // Для каждой группы считаем выручку (только невозвращённые позиции) и себестоимость.
        // ?? 0m защищает от NULL при пустой группе.
        var money = await itemRows
            .GroupBy(x => new { x.Date, x.Hour })
            .Select(g => new
            {
                g.Key.Date,
                g.Key.Hour,
                Revenue = g.Where(x => x.RefundedAt == null).Sum(x => (decimal?)(x.SalePrice * x.Quantity)) ?? 0m,
                Cost = g.Where(x => x.RefundedAt == null).Sum(x => (decimal?)(x.UnitCost * x.Quantity)) ?? 0m,
            })
            .ToListAsync(cancellationToken);

        // (день, час)-группы SQL сворачиваются в строки-бакеты общей сборкой
        // (SeriesBucketRows, api.md SeriesPointDto).
        var countRows = counts
            .Select(c => new SeriesBucketRows.CountRow(c.Date, c.Hour, c.Count))
            .ToList();

        var moneyRows = money
            .Select(m => new SeriesBucketRows.MoneyRow(m.Date, m.Hour, m.Revenue, m.Cost))
            .ToList();

        var dailyRows = SeriesBucketRows.MoneyAndCountRows(filter.Period, stepHours, moneyRows, countRows);

        // Возвращаем отсортированный список строк-бакетов.
        return dailyRows;
    }
}
