using SalesDashboard.Api.Dtos;

namespace SalesDashboard.Api.Validation;

/// <summary>Одна ошибка валидации, в форме массива <c>errors[]</c> из api.md.</summary>
public sealed record ValidationError(string Field, string Code, string Message);

/// <summary>
/// Ручная валидация (backend.md §6.3): правила просты, но контракту нужен
/// собственный <c>ProblemDetails</c> с <c>field</c>/<c>code</c>, который ни одна
/// библиотека атрибутов не отдаёт напрямую.
/// </summary>
public sealed class DashboardRequestValidator
{
    public IReadOnlyList<ValidationError> Validate(DashboardRequest request)
    {
        var errors = new List<ValidationError>();

        if (request.From is null)
            errors.Add(new ValidationError("from", "PERIOD_REQUIRED", "Field 'from' is required"));

        if (request.To is null)
            errors.Add(new ValidationError("to", "PERIOD_REQUIRED", "Field 'to' is required"));

        // Правило осмысленно только при обоих концах периода. Полуинтервал
        // [from, to), поэтому from == to — пустой период, тоже отклоняется.
        if (request.From is not null && request.To is not null && request.From >= request.To)
            errors.Add(new ValidationError("from", "PERIOD_INVALID_ORDER", "'from' must be earlier than 'to'"));

        // System.Text.Json биндит любое число в enum без проверки, что значение
        // определено, поэтому сегмент вне диапазона отсекается здесь (backend.md §6.2).
        if (request.Segment is not null && !Enum.IsDefined(request.Segment.Value))
            errors.Add(new ValidationError("segment", "SEGMENT_INVALID", "Field 'segment' must be one of: 1, 2, 3"));

        return errors;
    }
}
