using SalesDashboard.Domain;

namespace SalesDashboard.Application.Models;

/// <summary>
/// Именованный набор данных — единица, из которой строится каждый переключамый
/// блок дашборда (api.md, <c>DatasetDto&lt;T&gt;</c>). Элементы приходят заранее
/// отсортированными по метрике набора по убыванию, поэтому UI ничего не
/// пересортировывает, а переключение метрики — чистый клиентский выбор без рефетча.
/// </summary>
public sealed record DatasetModel<T>(string Name, IReadOnlyList<T> Items);

/// <summary>
/// Изменение относительно предыдущего сопоставимого периода (api.md, <c>DeltaDto</c>).
/// Вся модель отсутствует (<c>null</c>), когда дельту вычислить нельзя — пустой
/// базовый период или недостаточно данных, — что UI печатает как `—`.
/// </summary>
public sealed record DeltaModel(decimal Value, DeltaUnit Unit);

/// <summary>Одна точка дневной серии (api.md, <c>SeriesPointDto</c>).</summary>
public sealed record SeriesPointModel(DateTime Date, decimal Value);

/// <summary>
/// Доля элемента в результате периода в трёх взаимозаменяемых формах
/// (api.md, <c>ContributionDto</c>): печатаемое число, его подписное значение и
/// длина бара.
/// </summary>
/// <param name="ValueAbsolute">Абсолютное значение метрики, печатается крупно.</param>
/// <param name="ValueRelative">Доля (процент) или кратность, по <paramref name="ValueRelativeUnit"/>;
/// <c>null</c>, когда база группы пуста или отрицательна — UI печатает `—` вместо
/// бессмысленной доли (ui.md: лидер с отрицательной ВП получает «доля `—`»).</param>
/// <param name="ValueRelativeUnit">Решает формат подписи: «% от ВП» против «× к СЧ».</param>
/// <param name="ValueNormalized">Длина бара 0–100, масштабированная к максимуму группы — не доля.</param>
public sealed record ContributionModel(
    decimal ValueAbsolute,
    decimal? ValueRelative,
    ContributionBasis ValueRelativeUnit,
    decimal ValueNormalized);

/// <summary>
/// Строка «Остальные N», замыкающая топ-лист потерь (api.md, <c>*TailDto</c>).
/// Отсутствует, когда топ уже покрывает каждый объект с потерей.
/// </summary>
/// <param name="Count">Сколько объектов стоит за топ-листом.</param>
/// <param name="ValueAbsolute">Их суммарная потеря.</param>
/// <param name="ValueRelative">Их доля от суммы группы; доли топа плюс эта дают 100%.</param>
public sealed record LossTailModel(
    int Count,
    decimal ValueAbsolute,
    decimal ValueRelative);
