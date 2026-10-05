using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace SalesDashboard.Api.Errors;

/// <summary>
/// Обрабатывает только непредвиденные сбои (backend.md §6.5): 500 с
/// <c>ProblemDetails</c> без утечки серверных деталей. Отмена — штатное
/// завершение работы, поэтому пропускается, а не превращается в ProblemDetails.
/// </summary>
public sealed class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        if (exception is OperationCanceledException)
        {
            logger.LogDebug(exception, "Request cancelled by the client; no response is sent.");
            return false;
        }

        logger.LogError(exception, "Unhandled exception while building the dashboard.");

        httpContext.Response.StatusCode = StatusCodes.Status500InternalServerError;
        httpContext.Response.ContentType = "application/problem+json";

        await httpContext.Response.WriteAsJsonAsync(new ProblemDetails
        {
            Title = "Internal server error",
            Status = StatusCodes.Status500InternalServerError,
            Detail = "An unexpected error occurred",
        }, cancellationToken);

        return true;
    }
}
