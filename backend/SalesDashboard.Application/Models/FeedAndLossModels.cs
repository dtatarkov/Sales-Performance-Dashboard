using SalesDashboard.Domain;

namespace SalesDashboard.Application.Models;

/// <summary>
/// Лента последних продаж (api.md, блок 9): новейшие сделки периода по дате,
/// по убыванию. Строки итога нет — блоки потерь единственный источник истины
/// по суммам возвратов и отмен (ui.md, блок 9).
/// </summary>
public sealed record RecentSalesModel(IReadOnlyList<SaleFeedItemModel> Sales);

/// <summary>
/// Одна строка ленты (api.md, <c>SaleFeedItemDto</c>).
/// </summary>
/// <param name="Date">Дата сделки — дата оплаченной когорты, по которой упорядочена лента.</param>
/// <param name="Status">Выведен из дат событий строки, никогда не хранится.</param>
/// <param name="GrossProfit"><c>null</c> для возвращённых/отменённых — UI печатает причину вместо цифры прибыли.</param>
public sealed record SaleFeedItemModel(
    Guid Id,
    string Client,
    string Manager,
    DateTime Date,
    int ItemsCount,
    SaleStatus Status,
    decimal Revenue,
    decimal? GrossProfit);

/// <summary>
/// Возвраты периода (api.md, блок 10): что было оплачено и возвращено,
/// считаемое по <c>refundedAt</c>. Намеренно не слиты с отменами — у двух групп
/// разные причины, ответственные и действия (domain.md).
/// </summary>
/// <param name="Value">Сумма, возвращённая в периоде, по дате события.</param>
/// <param name="Rate">Когортная доля возвратов, процент; <c>null</c> при пустой оплаченной когорте.</param>
/// <param name="Top">Товары по возвращённой сумме, по убыванию; любой товар хотя бы с одним возвратом проходит.</param>
/// <param name="Tail">«Остальные N»; <c>null</c>, когда топ уже покрывает каждый товар.</param>
public sealed record RefundsModel(
    decimal Value,
    decimal? Rate,
    DeltaModel? RateDelta,
    IReadOnlyList<SeriesPointModel> Series,
    IReadOnlyList<LossItemModel> Top,
    LossTailModel? Tail);

/// <summary>
/// Отмены периода (api.md, блок 11): сделки, которые так и не были оплачены,
/// считаемые по <c>cancelledAt</c>. Это упущенная возможность, а не потерянные деньги.
/// </summary>
public sealed record CancellationsModel(
    decimal Value,
    decimal? Rate,
    DeltaModel? RateDelta,
    IReadOnlyList<SeriesPointModel> Series,
    IReadOnlyList<LossItemModel> Top,
    LossTailModel? Tail);

/// <summary>
/// Одна строка топ-листа потерь (api.md, <c>RefundTopItemDto</c> /
/// <c>CancellationTopItemDto</c>): товар для возвратов, менеджер для
/// отмен.
/// </summary>
/// <param name="Category">Категория товара, показывается только на строках возвратов.</param>
/// <param name="ValueAbsolute">Потеря, отнесённая на этот объект.</param>
/// <param name="ValueRelative">Доля от суммы группы, 0–100; строки топа плюс хвост дают 100%.</param>
/// <param name="ValueNormalized">Длина бара 0–100.</param>
public sealed record LossItemModel(
    Guid Id,
    string Name,
    string? Category,
    decimal ValueAbsolute,
    decimal ValueRelative,
    decimal ValueNormalized);
