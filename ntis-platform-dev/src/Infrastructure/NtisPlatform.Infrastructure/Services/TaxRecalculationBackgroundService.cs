using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using NtisPlatform.Application.DTOs.CapitalValue;
using NtisPlatform.Application.DTOs.PropertyCertificate;
using NtisPlatform.Application.DTOs.RetrospectiveTax;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.ICapitalValueService;
using NtisPlatform.Application.Interfaces.ICapitalValueService.ICapitalValueService;
using NtisPlatform.Application.Interfaces.RetrospectiveTax;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Infrastructure.Services;

/// <summary>
/// Implements asynchronous background tax recalculation for multi-unit entities (Societies, Wings).
/// Uses IBackgroundTaskQueue to process calculations in isolated scopes and broadcasts live
/// progress/completion via ITaxCalculationNotifier (SignalR).
/// </summary>
public class TaxRecalculationBackgroundService : ITaxRecalculationBackgroundService
{
    private readonly IBackgroundTaskQueue _backgroundTaskQueue;
    private readonly IRepository<PropertyEntity, int> _propertyRepository;
    private readonly IRepository<SocietyDetailsEntity, int> _societyRepository;
    private readonly IRepository<WingDetailsMastEntity, int> _wingDetailsMastRepository;
    private readonly ITaxCalculationJobCoordinator _coordinator;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<TaxRecalculationBackgroundService> _logger;

    public TaxRecalculationBackgroundService(
        IBackgroundTaskQueue backgroundTaskQueue,
        IRepository<PropertyEntity, int> propertyRepository,
        IRepository<SocietyDetailsEntity, int> societyRepository,
        IRepository<WingDetailsMastEntity, int> wingDetailsMastRepository,
        ITaxCalculationJobCoordinator coordinator,
        IServiceScopeFactory scopeFactory,
        ILogger<TaxRecalculationBackgroundService> logger)
    {
        _backgroundTaskQueue = backgroundTaskQueue;
        _propertyRepository = propertyRepository;
        _societyRepository = societyRepository;
        _wingDetailsMastRepository = wingDetailsMastRepository;
        _coordinator = coordinator;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task<string> EnqueueSocietyOrWingRecalculationAsync(
        string entityType,
        int? societyDetailId,
        int? wingDetailId,
        int userId,
        int certificateTypeId,
        CancellationToken cancellationToken = default)
    {
        var jobId = Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();
        var memberPropertyIds = await ResolveMemberPropertyIdsAsync(entityType, societyDetailId, wingDetailId, cancellationToken);

        _logger.LogInformation(
            "Enqueueing background tax recalculation Job {JobId}: EntityType={EntityType}, SocietyId={SocietyId}, WingId={WingId}, TotalUnits={TotalUnits}",
            jobId, entityType, societyDetailId, wingDetailId, memberPropertyIds.Count);

        if (memberPropertyIds.Count == 0)
        {
            return jobId;
        }

        var jobCtx = _coordinator.RegisterJob(jobId, entityType, societyDetailId, wingDetailId, memberPropertyIds.Count, createdByUserId: userId, parentToken: CancellationToken.None);

        _backgroundTaskQueue.QueueWorkItem(async (serviceProvider, bgToken) =>
        {
            var scopedLogger = serviceProvider.GetRequiredService<ILogger<TaxRecalculationBackgroundService>>();
            try
            {
                var notifier = serviceProvider.GetService<ITaxCalculationNotifier>();
                var scopeFactory = serviceProvider.GetRequiredService<IServiceScopeFactory>();

                var totalUnits = memberPropertyIds.Count;
                var succeeded = 0;
                var failed = 0;
                var failureDetails = new List<string>();
                var stopwatch = System.Diagnostics.Stopwatch.StartNew();

                // 1. Initial Progress Broadcast
                if (notifier != null)
                {
                    try
                    {
                        await notifier.NotifyProgressAsync(new TaxCalculationProgressDto
                        {
                            JobId = jobId,
                            EntityType = entityType,
                            SocietyDetailId = societyDetailId,
                            WingDetailId = wingDetailId,
                            TotalUnits = totalUnits,
                            ProcessedUnits = 0,
                            CurrentPropertyId = memberPropertyIds[0],
                            Status = "Processing",
                            StatusMessage = $"Starting tax calculation for {totalUnits} units..."
                        }, bgToken);
                    }
                    catch (Exception notifEx)
                    {
                        scopedLogger.LogWarning(notifEx, "Failed to broadcast initial progress for Job {JobId}", jobId);
                    }
                }

                // 2. Process each unit independently in an isolated DbContext scope
                for (var i = 0; i < memberPropertyIds.Count; i++)
                {
                    if (bgToken.IsCancellationRequested || jobCtx.IsCancellationRequested) break;

                    // Asynchronously wait if job is paused until resumed or cancelled
                    await jobCtx.WaitIfPausedAsync(bgToken);

                    if (bgToken.IsCancellationRequested || jobCtx.IsCancellationRequested) break;

                    var propertyId = memberPropertyIds[i];
                    jobCtx.CurrentPropertyId = propertyId;

                    try
                    {
                        using (var unitScope = scopeFactory.CreateScope())
                        {
                            var sp = unitScope.ServiceProvider;
                            var refresher = sp.GetRequiredService<IRetrospectiveTaxRefresher>();
                            var cvService = sp.GetService<ICapitalValueService>();

                            // RV, then the retrospective engine on the fresh NETTAX, under the property's lock: an API
                            // request or a certificate pipeline for the same property cannot run between the two steps.
                            await refresher.RefreshAsync(propertyId, userId, cancellationToken: bgToken);

                            if (cvService != null)
                            {
                                try
                                {
                                    await cvService.CreateAsync(new CreateCapitalValueDto { PropertyId = propertyId }, bgToken);
                                }
                                catch (Exception cvEx)
                                {
                                    scopedLogger.LogDebug(cvEx, "CV calculation not required or skipped for PropertyId={PropertyId}", propertyId);
                                }
                            }
                        }

                        succeeded++;
                    }
                    catch (Exception ex)
                    {
                        failed++;
                        var errorMsg = $"PropertyId={propertyId}: {ex.Message}";
                        failureDetails.Add(errorMsg);
                        scopedLogger.LogWarning(ex, "Background tax recalculation failed for PropertyId={PropertyId} in Job {JobId}", propertyId, jobId);
                    }

                    jobCtx.ProcessedUnits = i + 1;

                    // Broadcast progress after every unit
                    if (notifier != null)
                    {
                        try
                        {
                            await notifier.NotifyProgressAsync(new TaxCalculationProgressDto
                            {
                                JobId = jobId,
                                EntityType = entityType,
                                SocietyDetailId = societyDetailId,
                                WingDetailId = wingDetailId,
                                TotalUnits = totalUnits,
                                ProcessedUnits = i + 1,
                                CurrentPropertyId = propertyId,
                                Status = jobCtx.IsPaused ? "Paused" : "Processing",
                                StatusMessage = $"Calculated tax for unit {i + 1} of {totalUnits} (Property #{propertyId})"
                            }, bgToken);
                        }
                        catch (Exception notifEx)
                        {
                            scopedLogger.LogWarning(notifEx, "Failed to broadcast unit progress for Job {JobId}, PropertyId {PropertyId}", jobId, propertyId);
                        }
                    }
                }

                stopwatch.Stop();

                var isCancelled = jobCtx.IsCancellationRequested || bgToken.IsCancellationRequested;
                if (isCancelled)
                {
                    jobCtx.MarkCancelled();
                }
                var summary = isCancelled
                    ? $"Tax recalculation was terminated by user after processing {succeeded} of {totalUnits} units."
                    : (failed == 0
                        ? $"Tax recalculation completed successfully for all {totalUnits} units."
                        : $"Tax recalculation completed: {succeeded} succeeded, {failed} failed.");

                // 3. Final Completion Broadcast
                if (notifier != null)
                {
                    try
                    {
                        await notifier.NotifyCompletedAsync(new TaxCalculationCompletedDto
                        {
                            JobId = jobId,
                            EntityType = entityType,
                            SocietyDetailId = societyDetailId,
                            WingDetailId = wingDetailId,
                            TotalUnits = totalUnits,
                            SucceededCount = succeeded,
                            FailedCount = isCancelled ? (totalUnits - succeeded) : failed,
                            Status = isCancelled ? "Cancelled" : (failed == 0 ? "Completed" : "Failed"),
                            SummaryMessage = summary,
                            FailureDetails = failureDetails,
                            DurationMs = stopwatch.ElapsedMilliseconds,
                            CompletedAt = DateTime.UtcNow
                        }, bgToken);
                    }
                    catch (Exception notifEx)
                    {
                        scopedLogger.LogWarning(notifEx, "Failed to broadcast completion for Job {JobId}", jobId);
                    }
                }

                scopedLogger.LogInformation(
                    "Background tax recalculation Job {JobId} finished (Cancelled={Cancelled}) in {Duration}ms: Total={Total}, Succeeded={Succeeded}, Failed={Failed}",
                    jobId, isCancelled, stopwatch.ElapsedMilliseconds, totalUnits, succeeded, failed);
            }
            catch (Exception workerEx)
            {
                scopedLogger.LogError(workerEx, "Unhandled exception in background tax recalculation Job {JobId}", jobId);
            }
            finally
            {
                _coordinator.CompleteJob(jobId);
            }
        });

        return jobId;
    }

    public Task<string> EnqueuePropertyRecalculationAsync(
        List<int> propertyIds,
        int? societyDetailId,
        int? wingDetailId,
        int userId,
        int certificateTypeId,
        CancellationToken cancellationToken = default)
    {
        var distinctIds = propertyIds.Distinct().ToList();
        var jobId = Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();

        _logger.LogInformation(
            "Enqueueing background tax recalculation Job {JobId} for {Count} specific properties",
            jobId, distinctIds.Count);

        if (distinctIds.Count == 0)
        {
            return Task.FromResult(jobId);
        }

        var jobCtx = _coordinator.RegisterJob(jobId, "P", societyDetailId, wingDetailId, distinctIds.Count, createdByUserId: userId, parentToken: CancellationToken.None);

        _backgroundTaskQueue.QueueWorkItem(async (serviceProvider, bgToken) =>
        {
            var scopedLogger = serviceProvider.GetRequiredService<ILogger<TaxRecalculationBackgroundService>>();
            try
            {
                var notifier = serviceProvider.GetService<ITaxCalculationNotifier>();
                var scopeFactory = serviceProvider.GetRequiredService<IServiceScopeFactory>();

                var totalUnits = distinctIds.Count;
                var succeeded = 0;
                var failed = 0;
                var failureDetails = new List<string>();
                var stopwatch = System.Diagnostics.Stopwatch.StartNew();

                if (notifier != null)
                {
                    try
                    {
                        await notifier.NotifyProgressAsync(new TaxCalculationProgressDto
                        {
                            JobId = jobId,
                            EntityType = "P",
                            SocietyDetailId = societyDetailId,
                            WingDetailId = wingDetailId,
                            TotalUnits = totalUnits,
                            ProcessedUnits = 0,
                            CurrentPropertyId = distinctIds[0],
                            Status = "Processing",
                            StatusMessage = $"Starting tax calculation for {totalUnits} unit(s)..."
                        }, bgToken);
                    }
                    catch (Exception notifEx)
                    {
                        scopedLogger.LogWarning(notifEx, "Failed to broadcast initial progress for Job {JobId}", jobId);
                    }
                }

                for (var i = 0; i < distinctIds.Count; i++)
                {
                    if (bgToken.IsCancellationRequested || jobCtx.IsCancellationRequested) break;

                    // Asynchronously wait if job is paused until resumed or cancelled
                    await jobCtx.WaitIfPausedAsync(bgToken);

                    if (bgToken.IsCancellationRequested || jobCtx.IsCancellationRequested) break;

                    var propertyId = distinctIds[i];
                    jobCtx.CurrentPropertyId = propertyId;

                    try
                    {
                        using (var unitScope = scopeFactory.CreateScope())
                        {
                            var sp = unitScope.ServiceProvider;
                            var refresher = sp.GetRequiredService<IRetrospectiveTaxRefresher>();
                            var cvService = sp.GetService<ICapitalValueService>();

                            // RV, then the retrospective engine on the fresh NETTAX, under the property's lock: an API
                            // request or a certificate pipeline for the same property cannot run between the two steps.
                            await refresher.RefreshAsync(propertyId, userId, cancellationToken: bgToken);

                            if (cvService != null)
                            {
                                try
                                {
                                    await cvService.CreateAsync(new CreateCapitalValueDto { PropertyId = propertyId }, bgToken);
                                }
                                catch (Exception cvEx)
                                {
                                    scopedLogger.LogDebug(cvEx, "CV calculation not required or skipped for PropertyId={PropertyId}", propertyId);
                                }
                            }
                        }

                        succeeded++;
                    }
                    catch (Exception ex)
                    {
                        failed++;
                        var errorMsg = $"PropertyId={propertyId}: {ex.Message}";
                        failureDetails.Add(errorMsg);
                        scopedLogger.LogWarning(ex, "Background tax calculation failed for PropertyId={PropertyId} in Job {JobId}", propertyId, jobId);
                    }

                    jobCtx.ProcessedUnits = i + 1;

                    if (notifier != null)
                    {
                        try
                        {
                            await notifier.NotifyProgressAsync(new TaxCalculationProgressDto
                            {
                                JobId = jobId,
                                EntityType = "P",
                                SocietyDetailId = societyDetailId,
                                WingDetailId = wingDetailId,
                                TotalUnits = totalUnits,
                                ProcessedUnits = i + 1,
                                CurrentPropertyId = propertyId,
                                Status = jobCtx.IsPaused ? "Paused" : "Processing",
                                StatusMessage = $"Calculated tax for unit {i + 1} of {totalUnits} (Property #{propertyId})"
                            }, bgToken);
                        }
                        catch (Exception notifEx)
                        {
                            scopedLogger.LogWarning(notifEx, "Failed to broadcast unit progress for Job {JobId}, PropertyId {PropertyId}", jobId, propertyId);
                        }
                    }
                }

                stopwatch.Stop();

                var isCancelled = jobCtx.IsCancellationRequested || bgToken.IsCancellationRequested;
                if (isCancelled)
                {
                    jobCtx.MarkCancelled();
                }
                var summary = isCancelled
                    ? $"Tax recalculation was terminated by user after processing {succeeded} of {totalUnits} units."
                    : (failed == 0
                        ? $"Tax recalculation completed successfully for {totalUnits} unit(s)."
                        : $"Tax recalculation completed: {succeeded} succeeded, {failed} failed.");

                if (notifier != null)
                {
                    try
                    {
                        await notifier.NotifyCompletedAsync(new TaxCalculationCompletedDto
                        {
                            JobId = jobId,
                            EntityType = "P",
                            SocietyDetailId = societyDetailId,
                            WingDetailId = wingDetailId,
                            TotalUnits = totalUnits,
                            SucceededCount = succeeded,
                            FailedCount = isCancelled ? (totalUnits - succeeded) : failed,
                            Status = isCancelled ? "Cancelled" : (failed == 0 ? "Completed" : "Failed"),
                            SummaryMessage = summary,
                            FailureDetails = failureDetails,
                            DurationMs = stopwatch.ElapsedMilliseconds,
                            CompletedAt = DateTime.UtcNow
                        }, bgToken);
                    }
                    catch (Exception notifEx)
                    {
                        scopedLogger.LogWarning(notifEx, "Failed to broadcast completion for Job {JobId}", jobId);
                    }
                }

                scopedLogger.LogInformation(
                    "Background tax recalculation Job {JobId} finished (Cancelled={Cancelled}) in {Duration}ms: Total={Total}, Succeeded={Succeeded}, Failed={Failed}",
                    jobId, isCancelled, stopwatch.ElapsedMilliseconds, totalUnits, succeeded, failed);
            }
            catch (Exception workerEx)
            {
                scopedLogger.LogError(workerEx, "Unhandled exception in background tax recalculation Job {JobId}", jobId);
            }
            finally
            {
                _coordinator.CompleteJob(jobId);
            }
        });

        return Task.FromResult(jobId);
    }

    private async Task<List<int>> ResolveMemberPropertyIdsAsync(
        string entityType, int? societyDetailId, int? wingDetailId, CancellationToken cancellationToken)
    {
        var memberIds = new HashSet<int>();

        if (entityType == "W")
        {
            if (!wingDetailId.HasValue) return memberIds.ToList();

            var wingUnitIds = await _propertyRepository.GetQueryable()
                .Where(p => p.WingDetailId == wingDetailId.Value && p.IsActive && !p.MarkedForDeletion)
                .Select(p => p.Id)
                .ToListAsync(cancellationToken);
            foreach (var id in wingUnitIds) memberIds.Add(id);
            return memberIds.ToList();
        }

        if (entityType == "S")
        {
            if (!societyDetailId.HasValue) return memberIds.ToList();

            var representativePropertyId = await _societyRepository.GetQueryable()
                .Where(s => s.Id == societyDetailId.Value)
                .Select(s => s.PropertyId)
                .FirstOrDefaultAsync(cancellationToken);
            if (representativePropertyId.HasValue) memberIds.Add(representativePropertyId.Value);

            var wingIds = await _wingDetailsMastRepository.GetQueryable()
                .Where(w => w.SocietyDetailsMastId == societyDetailId.Value && w.IsActive && !w.MarkedForDeletion)
                .Select(w => w.Id)
                .ToListAsync(cancellationToken);

            if (wingIds.Count > 0)
            {
                var unitIds = await _propertyRepository.GetQueryable()
                    .Where(p => p.WingDetailId.HasValue && wingIds.Contains(p.WingDetailId.Value) && p.IsActive && !p.MarkedForDeletion)
                    .Select(p => p.Id)
                    .ToListAsync(cancellationToken);
                foreach (var id in unitIds) memberIds.Add(id);
            }
        }

        return memberIds.ToList();
    }
}
