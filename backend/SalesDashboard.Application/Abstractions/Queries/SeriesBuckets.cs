using SalesDashboard.Domain;

namespace SalesDashboard.Application.Abstractions.Queries;

/// <summary>
/// Бакеты непрерывных серий (api.md, <c>SeriesPointDto</c>). Период любой
/// длительности разбивается на равные диапазоны: шаг сетки — делитель
/// длительности в целых часах, ближайший к «длительность / 30», а число точек
/// удерживается в полосе [<see cref="MinPoints"/>, <see cref="MaxPoints"/>]
/// (api.md, «Сетка бакетов серий»). Сетка якорится на начало периода, поэтому
/// все диапазоны серии равной ширины и примыкают друг к другу без зазоров;
/// каждая точка несёт полуинтервал [dateFrom, dateTo).
/// </summary>
/// <remarks>
/// Рид-порты группируют строки SQL по паре (календарный день, час) — оба
/// поля транслируются в SQL на любом провайдере, — а бакет-ключ строки
/// собирает <see cref="KeyOf"/> от начала периода. Правило предполагает
/// целодневный период (полночь в обоих концах): это закрепляет валидатор
/// запроса (api.md, <c>PERIOD_NOT_DAY_ALIGNED</c>).
/// </remarks>
public static class SeriesBuckets
{
    /// <summary>Нижняя граница числа точек серии (api.md, полоса [24, 36]).</summary>
    public const int MinPoints = 24;

    /// <summary>Верхняя граница числа точек серии (api.md, полоса [24, 36]).</summary>
    public const int MaxPoints = 36;

    /// <summary>Целевое число точек: шаг ищется ближайшим к «длительность / 30».</summary>
    private const int TargetPoints = 30;

    /// <summary>
    /// Шаг сетки в часах: делитель длительности периода, ближайший к
    /// «длительность / TargetPoints»; при равном удалении выбирается более
    /// мелкий шаг (больше точек). Делитель в полосе существует всегда:
    /// длительность целодневного периода делится на 24, что даёт ровно
    /// <see cref="MinPoints"/> точек.
    /// </summary>
    /// <param name="period">Период запроса — определяет длительность и якорь сетки.</param>
    /// <returns>Шаг сетки в целых часах.</returns>
    public static int StepHoursOf(DateRange period)
    {
        var totalHours = (long)(period.To - period.From).TotalHours;

        // Полоса шагов, удерживающая число точек в [MinPoints, MaxPoints]:
        // step ≥ длительность/MaxPoints и step ≤ длительность/MinPoints.
        var minStep = (long)Math.Ceiling((double)totalHours / MaxPoints);
        var maxStep = totalHours / MinPoints;

        var target = (double)totalHours / TargetPoints;

        var bestStep = 0;
        var bestDistance = double.MaxValue;

        // Обход по возрастанию шага: первый шаг с минимальным удалением —
        // самый мелкий, поэтому тай-брейк «при равном удалении — более мелкий
        // шаг» выполняется сам (ветка равенства не нужна: пришедший позже шаг
        // всегда не меньше уже выбранного).
        for (var step = minStep; step <= maxStep; step++)
        {
            if (totalHours % step != 0)
                continue;

            var distance = Math.Abs(step - target);

            if (distance < bestDistance)
            {
                bestDistance = distance;
                bestStep = (int)step;
            }
        }

        // Для целодневного периода делитель в полосе гарантирован веткой
        // maxStep выше; защита оставлена guard'ом от нецелодневного периода,
        // который отклоняет валидатор запроса.
        if (bestStep == 0)
            bestStep = Math.Max(1, (int)(totalHours / MinPoints));

        return bestStep;
    }

    /// <summary>Начала всех бакетов периода: From + i × шаг, i = 0..count−1.</summary>
    /// <param name="period">Период запроса.</param>
    /// <returns>Список начал бакетов по возрастанию; число точек в полосе [24, 36].</returns>
    public static IReadOnlyList<DateTime> BucketsOf(DateRange period)
    {
        var stepHours = StepHoursOf(period);
        var count = (int)((period.To - period.From).TotalHours / stepHours);

        var buckets = new List<DateTime>(count);

        for (var i = 0; i < count; i++)
            buckets.Add(period.From.AddHours(i * stepHours));

        return buckets;
    }

    /// <summary>
    /// Начало бакета строки ряда: якорь — начало периода, индекс — целочисленное
    /// деление смещения события от начала периода на шаг. Целочисленная арифметика
    /// на тиках исключает ошибки округления double на границах бакетов.
    /// </summary>
    /// <param name="period">Период запроса — якорь сетки.</param>
    /// <param name="stepHours">Шаг сетки в часах (<see cref="StepHoursOf"/>).</param>
    /// <param name="date">Календарный день события (UTC, без времени).</param>
    /// <param name="hour">Час события (0–23).</param>
    /// <returns>Начало бакета серии, в который попадает событие.</returns>
    public static DateTime KeyOf(DateRange period, int stepHours, DateTime date, int hour)
    {
        var offsetTicks = date.AddHours(hour).Ticks - period.From.Ticks;
        var stepTicks = stepHours * TimeSpan.TicksPerHour;
        var bucketIndex = offsetTicks / stepTicks;

        return period.From.AddTicks(bucketIndex * stepTicks);
    }
}
