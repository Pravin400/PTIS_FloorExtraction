using NtisPlatform.Application.Interfaces;

namespace NtisPlatform.Worker.Services;

/// <summary>
/// Background processor worker for PTIS.usp_ProcessCdcChanges(@ProcessingType='MASTER').
/// Polls CDC change tables periodically to process master-data changes and populate
/// PTIS.MasterDataChangeBatch asynchronously, decoupling heavy CDC processing from Web API CRUD saves.
/// </summary>
public class CdcMasterProcessorWorker : BackgroundService
{
    private readonly ILogger<CdcMasterProcessorWorker> _logger;
    private readonly IServiceProvider _serviceProvider;
    private readonly IConfiguration _configuration;

    public CdcMasterProcessorWorker(
        ILogger<CdcMasterProcessorWorker> logger,
        IServiceProvider serviceProvider,
        IConfiguration configuration)
    {
        _logger = logger;
        _serviceProvider = serviceProvider;
        _configuration = configuration;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("CDC Master Processor Worker starting at: {time}", DateTimeOffset.Now);

        var pollIntervalSeconds = _configuration.GetValue<int>("CdcMasterProcessor:PollIntervalSeconds", 15);
        _logger.LogInformation("CDC Master Processor Config - Poll Interval: {PollIntervalSeconds}s", pollIntervalSeconds);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await using var scope = _serviceProvider.CreateAsyncScope();
                var trigger = scope.ServiceProvider.GetRequiredService<ICdcMasterProcessorTrigger>();
                await trigger.TriggerAsync(stoppingToken);

                await Task.Delay(TimeSpan.FromSeconds(pollIntervalSeconds), stoppingToken);
            }
            catch (TaskCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in CDC Master Processor Worker main loop");
                await Task.Delay(TimeSpan.FromSeconds(15), stoppingToken);
            }
        }

        _logger.LogInformation("CDC Master Processor Worker stopping at: {time}", DateTimeOffset.Now);
    }
}