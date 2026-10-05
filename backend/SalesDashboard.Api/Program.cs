using SalesDashboard.Api.Extensions;
using SalesDashboard.Application.Extensions;
using SalesDashboard.Infrastructure.Extensions;
using SalesDashboard.Infrastructure.Seed;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApi();

var app = builder.Build();

app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapControllers();

await app.InitializeDatabaseAsync();

app.Run();

/// <summary>Exposed so the integration tests can drive the real host.</summary>
public partial class Program;
