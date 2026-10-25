using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Options;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Infrastructure.Services;

/// <summary>
/// Deletes Property Media browse-upload session folders (see IPropertyMediaBrowseSessionStorage).
/// Each sweep deletes a folder immediately once its PropertyMediaJob (matched by SourceBatchKey)
/// has reached Completed/Failed, and otherwise falls back to age: anything older than
/// PropertyMediaBrowseSessions:RetentionHours with no such job (an abandoned, never-executed
/// preview) is deleted too.
/// </summary>
public class PropertyMediaBrowseSessionCleanupService : BackgroundService
{
    private static readonly TimeSpan SweepInterval = TimeSpan.FromMinutes(30);

    private readonly ILogger<PropertyMediaBrowseSessionCleanupService> _logger;
    private readonly IServiceProvider _serviceProvider;
    private readonly PropertyMediaBrowseSessionOptions _options;
    private readonly string _basePath;

    public PropertyMediaBrowseSessionCleanupService(
        ILogger<PropertyMediaBrowseSessionCleanupService> logger,
        IServiceProvider serviceProvider,
        IOptions<PropertyMediaBrowseSessionOptions> options)
    {
        _logger = logger;
        _serviceProvider = serviceProvider;
        _options = options.Value;

        var basePath = _options.BasePath;
        if (string.IsNullOrWhiteSpace(basePath))
        {
            basePath = Path.Combine("Uploads", "BrowseSessions");
        }
        _basePath = Path.GetFullPath(basePath);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("PropertyMediaBrowseSessionCleanupService starting at: {time}", DateTimeOffset.Now);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CleanupSessionsAsync(stoppingToken);
                await Task.Delay(SweepInterval, stoppingToken);
            }
            catch (TaskCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in PropertyMediaBrowseSessionCleanupService sweep");
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }
        }

        _logger.LogInformation("PropertyMediaBrowseSessionCleanupService stopping at: {time}", DateTimeOffset.Now);
    }

    private async Task CleanupSessionsAsync(CancellationToken cancellationToken)
    {
        if (!Directory.Exists(_basePath))
        {
            return;
        }

        var folders = Directory.GetDirectories(_basePath);
        if (folders.Length == 0)
        {
            return;
        }

        await using var scope = _serviceProvider.CreateAsyncScope();
        var jobRepo = scope.ServiceProvider.GetRequiredService<IRepository<PropertyMediaJobEntity, int>>();

        // Query all jobs referencing a browse session by SourceBatchKey
        var jobs = await jobRepo.GetQueryable()
            .Where(j => j.Operation == nameof(PropertyMediaJobOperation.BulkImportBrowsedFiles) && j.SourceBatchKey != null)
            .Select(j => new { j.SourceBatchKey, j.Status })
            .ToListAsync(cancellationToken);

        // Batch keys referenced by active jobs (Pending/InProgress/Creating/AwaitingConfirmation) must NEVER be deleted
        var activeBatchKeys = new HashSet<string>(
            jobs.Where(j => j.Status != nameof(PropertyMediaJobStatus.Completed)
                         && j.Status != nameof(PropertyMediaJobStatus.Failed))
                .Select(j => j.SourceBatchKey!),
            StringComparer.OrdinalIgnoreCase);

        // Batch keys of jobs that already finished (Completed/Failed) - safe to delete immediately
        var finishedBatchKeys = new HashSet<string>(
            jobs.Where(j => j.Status == nameof(PropertyMediaJobStatus.Completed)
                         || j.Status == nameof(PropertyMediaJobStatus.Failed))
                .Select(j => j.SourceBatchKey!),
            StringComparer.OrdinalIgnoreCase);

        var cutoffUtc = DateTime.UtcNow - TimeSpan.FromHours(_options.RetentionHours);

        foreach (var folder in folders)
        {
            var batchKey = Path.GetFileName(folder);

            // Never delete folders that are still needed by an active job
            if (activeBatchKeys.Contains(batchKey))
            {
                continue;
            }

            var isFinished = finishedBatchKeys.Contains(batchKey);
            var isExpired = !isFinished && Directory.GetLastWriteTimeUtc(folder) < cutoffUtc;

            if (!isFinished && !isExpired)
            {
                continue;
            }

            try
            {
                Directory.Delete(folder, recursive: true);
                _logger.LogInformation("Deleted Property Media browse session folder {Folder} ({Reason})",
                    folder, isFinished ? "job finished" : "expired");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to delete Property Media browse session folder {Folder}", folder);
            }
        }
    }
}
