using SalesDashboard.Application.Models;
using SalesDashboard.Domain;

namespace SalesDashboard.Application.Builders;

/// <summary>
/// Общие константы и небольшие помощники для билдеров блоков: подписи наборов
/// данных из ui.md, фабрики Δ, превращающие доменный <c>decimal?</c> в
/// присутствие или отсутствие <see cref="DeltaModel"/>, и перечисление дней,
/// по которому рисуются непрерывные серии.
/// </summary>
internal static class BuilderCommon
{
    /// <summary>Размер каждого списка «Топ-10» (ui.md, блоки 3, 4, 8 и топы потерь).</summary>
    internal const int TopN = 10;

    /// <summary>Строки ленты последних продаж (api.md, блок 9 — «~20 записей»).</summary>
    internal const int FeedLimit = 20;

    internal static class DatasetNames
    {
        internal const string Revenue = "Выручка";
        internal const string GrossProfit = "Валовая прибыль";
        internal const string AverageCheck = "Средний чек";
        internal const string SalesCount = "Кол-во продаж";
        internal const string Units = "Продано шт";
    }

    /// <summary>Каждый календарный день полуинтервала <c>[From, To)</c> в полночь UTC —
    /// серии остаются непрерывными через дни без продаж (api.md, блок 6).</summary>
    internal static IReadOnlyList<DateTime> DaysOf(DateRange period)
    {
        var days = new List<DateTime>();
        
        for (var day = period.From.Date; day < period.To; day = day.AddDays(1))
            days.Add(day);

        return days;
    }

    /// <summary>Относительная Δ как <see cref="DeltaModel"/>; вся модель
    /// отсутствует, когда база равна нулю или любая из сторон не определена.</summary>
    internal static DeltaModel? PercentDelta(this IDeltaCalculator calculator, decimal? current, decimal? previous)
        => current is null || previous is null
            ? null
            : Wrap(calculator.Percent(current.Value, previous.Value), DeltaUnit.Percent);

    /// <summary>Δ доли в процентных пунктах; отсутствует, когда любая из долей не определена.</summary>
    internal static DeltaModel? PointsDelta(this IDeltaCalculator calculator, decimal? current, decimal? previous)
        => Wrap(calculator.PercentagePoints(current, previous), DeltaUnit.Pp);

    private static DeltaModel? Wrap(decimal? value, DeltaUnit unit)
        => value is null ? null : new DeltaModel(value.Value, unit);
}
