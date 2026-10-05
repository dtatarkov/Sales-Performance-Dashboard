using Microsoft.AspNetCore.Mvc;
using SalesDashboard.Api.Validation;

namespace SalesDashboard.Api.Errors;

/// <summary>
/// Собирает 400-ответ с <see cref="ProblemDetails"/> (RFC 7807) из списка ошибок
/// валидации (api.md, «Ошибки»): первая ошибка идёт в <c>detail</c>, полный список —
/// в расширение <c>errors[]</c>.
/// </summary>
public static class ValidationProblemFactory
{
    public static BadRequestObjectResult Create(IReadOnlyList<ValidationError> errors)
    {
        var problem = new ProblemDetails
        {
            Title = "Validation failed",
            Status = StatusCodes.Status400BadRequest,
            Detail = errors[0].Message,
        };

        problem.Extensions["errors"] = errors
            .Select(e => new { field = e.Field, code = e.Code })
            .ToList();

        return new BadRequestObjectResult(problem)
        {
            ContentTypes = { "application/problem+json" },
        };
    }
}
