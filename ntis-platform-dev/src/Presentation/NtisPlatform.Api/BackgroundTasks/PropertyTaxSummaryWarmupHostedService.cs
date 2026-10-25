using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using NtisPlatform.Application.Interfaces;

namespace NtisPlatform.Api.BackgroundTasks;

/// <summary>
/// Pre-warms the Property Tax Summary Counts cache in the background upon application startup.
/// Ensures that the very first user who loads the Add Taxes / Property Tax Operations screen
/// experiences instant (< 10ms) responses without waiting for cold-cache calculation.
/// </summary>
public sealed class PropertyTaxSummaryWarmupHostedService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<PropertyTaxSummaryWarmupHostedService> _logger;

    public PropertyTaxSummaryWarmupHostedService(
        IServiceScopeFactory scopeFactory,
        ILogger<PropertyTaxSummaryWarmupHostedService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Short delay to allow web server bootstrap and database connection pool to settle
        await Task.Delay(TimeSpan.FromSeconds(3), stoppingToken);

        if (stoppingToken.IsCancellationRequested) return;

        try
        {
            _logger.LogInformation("PropertyTaxSummaryWarmupHostedService: Beginning background pre-warming of property tax summary counts...");
            using var scope = _scopeFactory.CreateScope();
            var service = scope.ServiceProvider.GetRequiredService<IPropertyTaxOperationsService>();

            await service.WarmupSummaryCountsAsync(null, stoppingToken);

            _logger.LogInformation("PropertyTaxSummaryWarmupHostedService: Property tax summary counts warmed up successfully.");
        }
        catch (OperationCanceledException)
        {
            // Graceful shutdown
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "PropertyTaxSummaryWarmupHostedService: Background warmup encountered an error (application will continue normally).");
        }
    }
}
