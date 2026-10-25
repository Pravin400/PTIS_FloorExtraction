using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Interfaces.PropertyMedia;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace NtisPlatform.Worker.Services;

/// <summary>
/// Background worker service for processing Property Media bulk-import jobs asynchronously.
/// </summary>
public class PropertyMediaJobProcessorWorker : BackgroundService
{
    private readonly ILogger<PropertyMediaJobProcessorWorker> _logger;
    private readonly IServiceProvider _serviceProvider;
    private readonly IConfiguration _configuration;

    public PropertyMediaJobProcessorWorker(
        ILogger<PropertyMediaJobProcessorWorker> logger,
        IServiceProvider serviceProvider,
        IConfiguration configuration)
    {
        _logger = logger;
        _serviceProvider = serviceProvider;
        _configuration = configuration;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Property Media Job Processor Worker starting at: {time}", DateTimeOffset.Now);

        var pollIntervalSeconds = _configuration.GetValue<int>("PropertyMediaJobProcessor:PollIntervalSeconds", 2);
        var recoveryIntervalMinutes = _configuration.GetValue<int>("PropertyMediaJobProcessor:RecoveryCheckIntervalMinutes", 15);
        _logger.LogInformation("Property Media Job Processor Config - Poll Interval: {PollIntervalSeconds}s", pollIntervalSeconds);


        // Self-healing: recover any jobs stranded in InProgress after unexpected process termination
        await RecoverStaleJobsAsync(stoppingToken);
        var lastRecoveryCheck = DateTime.UtcNow;

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                if (DateTime.UtcNow - lastRecoveryCheck >= TimeSpan.FromMinutes(recoveryIntervalMinutes))
                {
                    lastRecoveryCheck = DateTime.UtcNow;
                    await RecoverStaleJobsAsync(stoppingToken);
                }

                await using var scope = _serviceProvider.CreateAsyncScope();
                var jobRepo = scope.ServiceProvider.GetRequiredService<IRepository<PropertyMediaJobEntity, int>>();
                var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

                // Poll for the oldest Pending active job (ordered by CreatedDate)
                var job = await jobRepo.GetQueryable()
                    .Where(j => j.Status == nameof(PropertyMediaJobStatus.Pending)
                        && j.IsActive
                        && !j.MarkedForDeletion)
                    .OrderBy(j => j.CreatedDate)
                    .FirstOrDefaultAsync(stoppingToken);

                if (job != null)
                {
                    _logger.LogInformation("Found pending Property Media job {JobCode}. Attempting to lock...", job.JobCode);

                    // Lock the job to Running state so no other worker instance picks it up
                    job.Status = nameof(PropertyMediaJobStatus.Running);
                    job.StartTime = DateTime.Now;
                    job.UpdatedDate = DateTime.Now; // Triggers the concurrency token check

                    try
                    {
                        await jobRepo.UpdateAsync(job, stoppingToken);
                        await unitOfWork.SaveChangesAsync(stoppingToken);
                        _logger.LogInformation("Successfully claimed job {JobCode}. Starting execution...", job.JobCode);
                    }
                    catch (DbUpdateConcurrencyException)
                    {
                        // Concurrency conflict: another worker instance claimed this job first
                        _logger.LogWarning("Job {JobCode} was already claimed by another worker instance. Skipping.", job.JobCode);
                        unitOfWork.DiscardChanges();
                        continue; // Proceed to the next loop iteration to look for a different job
                    }

                    var operationsService = scope.ServiceProvider.GetRequiredService<IPropertyMediaOperationsService>();

                    try
                    {
                        await operationsService.ProcessJobAsync(job.Id, stoppingToken);
                        _logger.LogInformation("Job {JobCode} processed successfully.", job.JobCode);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error processing Property Media job {JobCode}", job.JobCode);

                        // Mark job as Failed in case of catastrophic error
                        job.Status = nameof(PropertyMediaJobStatus.Failed);
                        job.CompleteTime = DateTime.Now;
                        job.Remarks = "This job operation failed.";
                        job.ErrorMessage = ex is ArgumentException or InvalidOperationException
                            ? (ex.Message.Length > 500 ? ex.Message[..500] : ex.Message)
                            : "An unexpected error occurred during job execution. Technical details have been logged.";
                        job.UpdatedDate = DateTime.Now;
                        await jobRepo.UpdateAsync(job, stoppingToken);
                        await unitOfWork.SaveChangesAsync(stoppingToken);
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
                _logger.LogError(ex, "Error in Property Media Job Processor Worker main loop");
                await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
            }
        }

        _logger.LogInformation("Property Media Job Processor Worker stopping at: {time}", DateTimeOffset.Now);
    }

    private async Task RecoverStaleJobsAsync(CancellationToken cancellationToken)
    {
        try
        {
            var staleThresholdMinutes = _configuration.GetValue<int>("PropertyMediaJobProcessor:StaleJobThresholdMinutes", 30);
            var cutoff = DateTime.Now.AddMinutes(-staleThresholdMinutes);

            await using var scope = _serviceProvider.CreateAsyncScope();
            var jobRepo = scope.ServiceProvider.GetRequiredService<IRepository<PropertyMediaJobEntity, int>>();
            var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

            var staleJobs = await jobRepo.GetQueryable()
                .Where(j => (j.Status == nameof(PropertyMediaJobStatus.Running) || j.Status == "InProgress")
                    && j.IsActive
                    && !j.MarkedForDeletion
                    && (j.UpdatedDate < cutoff || (j.UpdatedDate == null && j.StartTime < cutoff)))
                .ToListAsync(cancellationToken);

            if (staleJobs.Count > 0)
            {
                foreach (var job in staleJobs)
                {
                    _logger.LogWarning("Resetting stranded {Status} Property Media job {JobCode} back to Pending", job.Status, job.JobCode);
                    job.Status = nameof(PropertyMediaJobStatus.Pending);
                    job.UpdatedDate = DateTime.Now;
                    await jobRepo.UpdateAsync(job, cancellationToken);
                }

                await unitOfWork.SaveChangesAsync(cancellationToken);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to recover stale Running Property Media jobs");
        }
    }
}
