using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Infrastructure.Data;

namespace NtisPlatform.Worker.Services;

/// <summary>
/// Resolves PENDING PTIS.MasterDataChangeBatch rows (populated by PTIS.usp_ProcessCdcChanges) into
/// PropertyTaxRecalcFlag rows via <see cref="IPropertyTaxOperationsService.ResolveMasterDataChangeBatchAsync"/>.
/// Runs on its own short poll interval, independent of <see cref="CdcMasterProcessorWorker"/>'s own
/// (longer) poll â€” detection (calling the SP) and resolution (turning a detected batch into flags)
/// are different concerns with different cadences.
/// </summary>
public class MasterDataChangeResolverWorker : BackgroundService
{
    private readonly ILogger<MasterDataChangeResolverWorker> _logger;
    private readonly IServiceProvider _serviceProvider;
    private readonly IConfiguration _configuration;

    public MasterDataChangeResolverWorker(
        ILogger<MasterDataChangeResolverWorker> logger,
        IServiceProvider serviceProvider,
        IConfiguration configuration)
    {
        _logger = logger;
        _serviceProvider = serviceProvider;
        _configuration = configuration;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Master Data Change Resolver Worker starting at: {time}", DateTimeOffset.Now);

        var pollIntervalSeconds = _configuration.GetValue<int>("MasterDataChangeResolver:PollIntervalSeconds", 10);
        var stuckThresholdMinutes = _configuration.GetValue<int>("MasterDataChangeResolver:StuckBatchThresholdMinutes", 60);
        _logger.LogInformation(
            "Master Data Change Resolver Config - Poll Interval: {PollIntervalSeconds}s, Stuck Batch Threshold: {StuckBatchThresholdMinutes}m",
            pollIntervalSeconds, stuckThresholdMinutes);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await using var scope = _serviceProvider.CreateAsyncScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var batchRepo = scope.ServiceProvider.GetRequiredService<IRepository<MasterDataChangeBatchEntity, long>>();

                // Reclaim batches left IN_PROGRESS by a crashed/killed worker instance using LINQ ExecuteUpdateAsync.
                var stuckCutoff = DateTime.UtcNow.AddMinutes(-stuckThresholdMinutes);
                await dbContext.Set<MasterDataChangeBatchEntity>()
                    .Where(b => b.Status == "IN_PROGRESS" && b.StartedAt < stuckCutoff)
                    .ExecuteUpdateAsync(s => s
                        .SetProperty(b => b.Status, "PENDING")
                        .SetProperty(b => b.StartedAt, (DateTime?)null),
                        stoppingToken);

                // Find the oldest PENDING active batch using LINQ.
                var batchId = await batchRepo.GetQueryable()
                    .Where(b => b.Status == "PENDING" && b.IsActive)
                    .OrderBy(b => b.CreatedAt)
                    .Select(b => b.Id)
                    .FirstOrDefaultAsync(stoppingToken);

                if (batchId != default)
                {
                    // Conditional claim using LINQ ExecuteUpdateAsync â€” 0 rows affected means another worker instance beat us to it.
                    var claimedAt = DateTime.UtcNow;
                    var claimed = await dbContext.Set<MasterDataChangeBatchEntity>()
                        .Where(b => b.Id == batchId && b.Status == "PENDING")
                        .ExecuteUpdateAsync(s => s
                            .SetProperty(b => b.Status, "IN_PROGRESS")
                            .SetProperty(b => b.StartedAt, claimedAt),
                            stoppingToken);

                    if (claimed > 0)
                    {
                        _logger.LogInformation("Claimed MasterDataChangeBatch {BatchId}. Resolving...", batchId);

                        var operationsService = scope.ServiceProvider.GetRequiredService<IPropertyTaxOperationsService>();
                        try
                        {
                            await operationsService.ResolveMasterDataChangeBatchAsync(batchId, stoppingToken);
                            _logger.LogInformation("MasterDataChangeBatch {BatchId} resolved.", batchId);
                        }
                        catch (Exception ex)
                        {
                            // Last-resort safety net â€” ResolveMasterDataChangeBatchAsync already handles
                            // its own FAILED-status bookkeeping internally; this only guards against a
                            // truly catastrophic failure (e.g. a dropped DB connection) that shouldn't
                            // crash the worker's host loop.
                            _logger.LogError(ex, "Error resolving MasterDataChangeBatch {BatchId}", batchId);
                        }
                    }
                    else
                    {
                        _logger.LogInformation("MasterDataChangeBatch {BatchId} was already claimed by another worker instance. Skipping.", batchId);
                    }
                }

                await Task.Delay(TimeSpan.FromSeconds(pollIntervalSeconds), stoppingToken);
            }
            catch (TaskCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in Master Data Change Resolver Worker main loop");
                await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
            }
        }

        _logger.LogInformation("Master Data Change Resolver Worker stopping at: {time}", DateTimeOffset.Now);
    }
}