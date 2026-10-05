using Microsoft.EntityFrameworkCore;
using SalesDashboard.Application.Abstractions.Queries;
using SalesDashboard.Infrastructure.Extensions;
using SalesDashboard.Infrastructure.Persistence;

namespace SalesDashboard.Infrastructure.ReadPorts;

/// <summary>
/// Источник данных по менеджерам (backend.md §5.3): ростер, агрегаты оплачиваемой
/// когорты по каждому менеджеру и дневной ряд одного менеджера. Отмены считаются
/// по <c>cancelledAt</c> в том же окне.
/// </summary>
public sealed class EfManagerReadPort(SalesDbContext db) : IManagerReadPort
{
    public async Task<IReadOnlyList<ManagerRosterRow>> ReadRosterAsync(CancellationToken cancellationToken)
    {
        // Справочник менеджеров, отсортированный по имени — база строк рейтинга.
        var roster = await db.Managers.AsNoTracking()
            .OrderBy(m => m.Name)
            .Select(m => new ManagerRosterRow(m.Id, m.Name, m.Avatar, m.Initials, m.Team))
            .ToListAsync(cancellationToken);

        return roster;
    }

    public async Task<IReadOnlyList<ManagerAggregateRow>> ReadAggregatesAsync(ReadFilter filter, CancellationToken cancellationToken)
    {
        var paid = db.Sales.AsNoTracking().InPaidCohort(filter);

        // Развёртка до позиций под группировкой: деньги нужны на уровне позиций,
        // а счётчики сделок восстанавливаются distinct по Id (JOIN размножил
        // строки, поэтому прямого Count недостаточно).
        var itemRows = from s in paid
                       from i in s.Items
                       select new { s.ManagerId, s.Id, s.RefundedAt, i.Quantity, i.SalePrice, i.UnitCost };

        var paidAggregates = await itemRows
            .GroupBy(x => x.ManagerId)
            .Select(g => new
            {
                ManagerId = g.Key,
                Revenue = g.Where(x => x.RefundedAt == null).Sum(x => (decimal?)(x.SalePrice * x.Quantity)) ?? 0m,
                Cost = g.Where(x => x.RefundedAt == null).Sum(x => (decimal?)(x.UnitCost * x.Quantity)) ?? 0m,
                PaidCount = g.Select(x => x.Id).Distinct().Count(),
                RefundedCount = g.Where(x => x.RefundedAt != null).Select(x => x.Id).Distinct().Count(),
            })
            .ToListAsync(cancellationToken);

        // Отмены — отдельное окно по cancelledAt: неоплаченная отмена не входит
        // в оплаченную когорту, но в блоке менеджера должна быть учтена.
        var cancelledAggregates = await db.Sales.AsNoTracking()
            .InCancelledWindow(filter)
            .GroupBy(s => s.ManagerId)
            .Select(g => new { ManagerId = g.Key, CancelledCount = g.Count() })
            .ToListAsync(cancellationToken);

        var paidById = paidAggregates.ToDictionary(a => a.ManagerId);
        var cancelledById = cancelledAggregates.ToDictionary(a => a.ManagerId);

        var rows = paidById.Keys
            .Concat(cancelledById.Keys)
            .Distinct()
            .Select(id =>
            {
                paidById.TryGetValue(id, out var agg);
                cancelledById.TryGetValue(id, out var cancel);

                return new ManagerAggregateRow(
                    id,
                    agg?.Revenue ?? 0m,
                    agg?.Cost ?? 0m,
                    agg?.PaidCount ?? 0,
                    agg?.RefundedCount ?? 0,
                    cancel?.CancelledCount ?? 0);
            })
            .ToList();

        return rows;
    }

    public async Task<IReadOnlyList<DailyAggregateRow>> ReadDailyByManagerAsync(
        Guid managerId,
        ReadFilter filter,
        CancellationToken cancellationToken)
    {
        // Оплаченная когорта с фильтром по конкретному менеджеру.
        var paid = db.Sales.AsNoTracking().InPaidCohort(filter).Where(s => s.ManagerId == managerId);

        // Счётчик сделок по дням (без JOIN к позициям).
        var counts = await paid
            .GroupBy(s => s.PaidAt!.Value.Date)
            .Select(g => new { Date = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        // Разворачиваем продажи в позиции для подсчёта денег.
        var itemRows = from s in paid
                       from i in s.Items
                       select new
                       {
                           // День оплаты (без времени) — ключ группировки.
                           s.PaidAt!.Value.Date,
                           // Фильтр по возврату.
                           s.RefundedAt,
                           // Количество.
                           i.Quantity,
                           // Цена продажи.
                           i.SalePrice,
                           // Себестоимость.
                           i.UnitCost,
                       };

        // Группируем позиции по дню и считаем суммы только по невозвращённым позициям.
        var money = await itemRows
            .GroupBy(x => x.Date)
            .Select(g => new
            {
                // Ключ группировки.
                Date = g.Key,
                // Выручка дня: SUM(SalePrice × Quantity), невозвращённые позиции.
                Revenue = g.Where(x => x.RefundedAt == null).Sum(x => (decimal?)(x.SalePrice * x.Quantity)) ?? 0m,
                // Себестоимость дня: SUM(UnitCost × Quantity), невозвращённые позиции.
                Cost = g.Where(x => x.RefundedAt == null).Sum(x => (decimal?)(x.UnitCost * x.Quantity)) ?? 0m,
            })
            .ToListAsync(cancellationToken);

        // Индекс счётчика по дню для подстановки в итоговую строку.
        var countByDay = counts.ToDictionary(c => c.Date, c => c.Count);

        // Сборка итоговых строк: упорядочивание по дате, подстановка счётчика.
        var dailyRows = money
            .OrderBy(m => m.Date)
            .Select(m => new DailyAggregateRow(
                m.Date,
                m.Revenue,
                m.Cost,
                countByDay.TryGetValue(m.Date, out var count) ? count : 0))
            .ToList();

        return dailyRows;
    }
}
