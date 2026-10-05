# Multi-stage build for the Sales Dashboard API (.NET 8).
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy the solution and restore against the API project only.
COPY . .
RUN dotnet restore "SalesDashboard.Api/SalesDashboard.Api.csproj"

RUN dotnet publish "SalesDashboard.Api/SalesDashboard.Api.csproj" \
    -c Release \
    -o /app/publish \
    /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "SalesDashboard.Api.dll"]
