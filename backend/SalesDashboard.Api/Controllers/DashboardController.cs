using Microsoft.AspNetCore.Mvc;
using SalesDashboard.Api.Dtos;
using SalesDashboard.Api.Errors;
using SalesDashboard.Api.Mapping;
using SalesDashboard.Api.Validation;
using SalesDashboard.Application.Models;
using SalesDashboard.Application.UseCases;

namespace SalesDashboard.Api.Controllers;

/// <summary>
/// Тонкий контроллер (backend.md §6.1): валидация → маппинг в query → use case →
/// маппинг в DTO. Бизнес-логики здесь нет. <c>CancellationToken</c> привязывается
/// ASP.NET Core к <c>HttpContext.RequestAborted</c> и проходит до EF Core.
/// </summary>
[ApiController]
[Route("api/v1/dashboard")]
public sealed class DashboardController(
    IGetDashboardUseCase useCase,
    DashboardRequestValidator validator,
    IApiMapper<DashboardRequest, DashboardQuery> requestMapper,
    IApiMapper<DashboardModel, DashboardDto> responseMapper) : ControllerBase
{
    [HttpPost]
    [ProducesResponseType<DashboardDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<DashboardDto>> GetDashboard(
        [FromBody] DashboardRequest request,
        CancellationToken cancellationToken)
    {
        var errors = validator.Validate(request);
        
        if (errors.Count > 0)
            return ValidationProblemFactory.Create(errors);

        var query = requestMapper.Map(request);
        var model = await useCase.ExecuteAsync(query, cancellationToken);
        var dto = responseMapper.Map(model);

        return Ok(dto);
    }
}
