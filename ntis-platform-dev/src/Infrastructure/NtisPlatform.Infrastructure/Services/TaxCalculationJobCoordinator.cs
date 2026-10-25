using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;
using NtisPlatform.Application.Interfaces;

namespace NtisPlatform.Infrastructure.Services;

/// <summary>
/// Execution context for an active background tax calculation job.
/// Supports thread-safe pause, resume, and cancel operations.
/// </summary>
public class TaxCalculationJobContext : ITaxCalculationJobContext, IDisposable
{
    private readonly object _lock = new();
    private readonly CancellationTokenSource _cts;
    private TaskCompletionSource<bool>? _pauseTcs;
    private TaxCalculationJobStatus _status = TaxCalculationJobStatus.Processing;
    private int _processedUnits;
    private int _currentPropertyId;

    public string JobId { get; }
    public string EntityType { get; }
    public int? SocietyDetailId { get; }
    public int? WingDetailId { get; }
    public int TotalUnits { get; }
    public int CreatedByUserId { get; }

    public int ProcessedUnits
    {
        get => Volatile.Read(ref _processedUnits);
        set => Volatile.Write(ref _processedUnits, value);
    }

    public int CurrentPropertyId
    {
        get => Volatile.Read(ref _currentPropertyId);
        set => Volatile.Write(ref _currentPropertyId, value);
    }

    public TaxCalculationJobStatus Status
    {
        get { lock (_lock) return _status; }
        private set { lock (_lock) _status = value; }
    }

    public bool IsCancellationRequested
    {
        get
        {
            try { return _cts.IsCancellationRequested; }
            catch (ObjectDisposedException) { return true; }
        }
    }
    public bool IsPaused => Status == TaxCalculationJobStatus.Paused;

    public TaxCalculationJobContext(
        string jobId,
        string entityType,
        int? societyDetailId,
        int? wingDetailId,
        int totalUnits,
        int createdByUserId,
        CancellationToken parentToken = default)
    {
        JobId = jobId;
        EntityType = entityType;
        SocietyDetailId = societyDetailId;
        WingDetailId = wingDetailId;
        TotalUnits = totalUnits;
        CreatedByUserId = createdByUserId;
        _cts = CancellationTokenSource.CreateLinkedTokenSource(parentToken);
    }

    public async Task WaitIfPausedAsync(CancellationToken cancellationToken = default)
    {
        TaskCompletionSource<bool>? tcs;
        lock (_lock)
        {
            if (_status != TaxCalculationJobStatus.Paused) return;
            tcs = _pauseTcs;
        }

        if (tcs != null)
        {
            using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, _cts.Token);
            using (linkedCts.Token.Register(() => tcs.TrySetResult(true)))
            {
                await tcs.Task;
            }
        }
    }

    public bool Pause()
    {
        lock (_lock)
        {
            if (_status == TaxCalculationJobStatus.Processing || _status == TaxCalculationJobStatus.Pending)
            {
                _status = TaxCalculationJobStatus.Paused;
                if (_pauseTcs == null || _pauseTcs.Task.IsCompleted)
                {
                    _pauseTcs = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
                }
                return true;
            }
            return false;
        }
    }

    public bool Resume()
    {
        lock (_lock)
        {
            if (_status == TaxCalculationJobStatus.Paused)
            {
                _status = TaxCalculationJobStatus.Processing;
                _pauseTcs?.TrySetResult(true);
                _pauseTcs = null;
                return true;
            }
            return false;
        }
    }

    public bool Cancel()
    {
        lock (_lock)
        {
            if (_status != TaxCalculationJobStatus.Cancelling &&
                _status != TaxCalculationJobStatus.Cancelled &&
                _status != TaxCalculationJobStatus.Completed &&
                _status != TaxCalculationJobStatus.Failed)
            {
                _status = TaxCalculationJobStatus.Cancelling;
                _pauseTcs?.TrySetResult(true);
                _pauseTcs = null;
                try
                {
                    if (!_cts.IsCancellationRequested)
                    {
                        _cts.Cancel();
                    }
                }
                catch (ObjectDisposedException) { }
                return true;
            }
            return false;
        }
    }

    public bool MarkCancelled()
    {
        lock (_lock)
        {
            if (_status == TaxCalculationJobStatus.Cancelling || _cts.IsCancellationRequested)
            {
                _status = TaxCalculationJobStatus.Cancelled;
                return true;
            }
            return false;
        }
    }

    public void Complete(TaxCalculationJobStatus finalStatus = TaxCalculationJobStatus.Completed)
    {
        lock (_lock)
        {
            if (_status == TaxCalculationJobStatus.Cancelling || _cts.IsCancellationRequested)
            {
                _status = TaxCalculationJobStatus.Cancelled;
            }
            else if (_status != TaxCalculationJobStatus.Cancelled)
            {
                _status = finalStatus;
            }
        }
    }

    public void Dispose()
    {
        try
        {
            _cts.Dispose();
        }
        catch { }
    }
}

/// <summary>
/// Lightweight, read-only snapshot of a completed or cancelled background calculation job.
/// Retains final state for status queries without holding locks, active CTS, or background primitives.
/// </summary>
public sealed class CompletedTaxCalculationJobContext : ITaxCalculationJobContext
{
    public string JobId { get; }
    public string EntityType { get; }
    public int? SocietyDetailId { get; }
    public int? WingDetailId { get; }
    public int TotalUnits { get; }
    public int CreatedByUserId { get; }
    public int ProcessedUnits { get; set; }
    public int CurrentPropertyId { get; set; }
    public TaxCalculationJobStatus Status { get; }
    public bool IsCancellationRequested { get; }
    public bool IsPaused => false;
    public DateTime CompletedAt { get; }

    public CompletedTaxCalculationJobContext(
        string jobId,
        string entityType,
        int? societyDetailId,
        int? wingDetailId,
        int totalUnits,
        int processedUnits,
        int currentPropertyId,
        int createdByUserId,
        TaxCalculationJobStatus status,
        bool isCancellationRequested,
        DateTime completedAt)
    {
        JobId = jobId;
        EntityType = entityType;
        SocietyDetailId = societyDetailId;
        WingDetailId = wingDetailId;
        TotalUnits = totalUnits;
        ProcessedUnits = processedUnits;
        CurrentPropertyId = currentPropertyId;
        CreatedByUserId = createdByUserId;
        Status = status;
        IsCancellationRequested = isCancellationRequested;
        CompletedAt = completedAt;
    }

    public Task WaitIfPausedAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
    public bool Pause() => false;
    public bool Resume() => false;
    public bool Cancel() => false;
    public bool MarkCancelled() => false;
    public void Complete(TaxCalculationJobStatus finalStatus = TaxCalculationJobStatus.Completed) { }
}

/// <summary>
/// Singleton coordinator for managing all active background tax calculation jobs.
/// </summary>
public class TaxCalculationJobCoordinator : ITaxCalculationJobCoordinator
{
    private const int MaxCompletedJobs = 500;
    private readonly ConcurrentDictionary<string, TaxCalculationJobContext> _jobs = new(StringComparer.OrdinalIgnoreCase);
    private readonly ConcurrentDictionary<string, CompletedTaxCalculationJobContext> _completedJobs = new(StringComparer.OrdinalIgnoreCase);
    private readonly ILogger<TaxCalculationJobCoordinator> _logger;
    private readonly TimeSpan _retentionWindow;

    public int ActiveJobsCount => _jobs.Count;
    public int CompletedJobsCount => _completedJobs.Count;

    public TaxCalculationJobCoordinator(ILogger<TaxCalculationJobCoordinator> logger)
        : this(logger, retentionWindow: null)
    {
    }

    public TaxCalculationJobCoordinator(ILogger<TaxCalculationJobCoordinator> logger, TimeSpan? retentionWindow)
    {
        _logger = logger;
        _retentionWindow = retentionWindow ?? TimeSpan.FromHours(1);
    }

    public ITaxCalculationJobContext RegisterJob(
        string jobId,
        string entityType,
        int? societyDetailId,
        int? wingDetailId,
        int totalUnits,
        int createdByUserId,
        CancellationToken parentToken = default)
    {
        var context = new TaxCalculationJobContext(jobId, entityType, societyDetailId, wingDetailId, totalUnits, createdByUserId, parentToken);
        _jobs[jobId] = context;
        _logger.LogInformation("Registered background tax recalculation job context {JobId} (Units: {TotalUnits}, User: {UserId})", jobId, totalUnits, createdByUserId);
        return context;
    }

    public ITaxCalculationJobContext? GetJob(string jobId)
    {
        if (string.IsNullOrWhiteSpace(jobId)) return null;

        if (_jobs.TryGetValue(jobId, out var context))
        {
            return context;
        }

        if (_completedJobs.TryGetValue(jobId, out var completed))
        {
            if (DateTime.UtcNow - completed.CompletedAt <= _retentionWindow)
            {
                return completed;
            }
            _completedJobs.TryRemove(jobId, out _);
        }

        return null;
    }

    public bool PauseJob(string jobId)
    {
        if (string.IsNullOrWhiteSpace(jobId)) return false;
        if (_jobs.TryGetValue(jobId, out var context))
        {
            var result = context.Pause();
            if (result)
            {
                _logger.LogInformation("Job {JobId} paused by user request", jobId);
            }
            return result;
        }
        return false;
    }

    public bool ResumeJob(string jobId)
    {
        if (string.IsNullOrWhiteSpace(jobId)) return false;
        if (_jobs.TryGetValue(jobId, out var context))
        {
            var result = context.Resume();
            if (result)
            {
                _logger.LogInformation("Job {JobId} resumed by user request", jobId);
            }
            return result;
        }
        return false;
    }

    public bool CancelJob(string jobId)
    {
        if (string.IsNullOrWhiteSpace(jobId)) return false;
        if (_jobs.TryGetValue(jobId, out var context))
        {
            var result = context.Cancel();
            if (result)
            {
                _logger.LogInformation("Job {JobId} cancelled by user request", jobId);
            }
            return result;
        }
        return false;
    }

    public bool MarkJobCancelled(string jobId)
    {
        if (string.IsNullOrWhiteSpace(jobId)) return false;
        if (_jobs.TryGetValue(jobId, out var context))
        {
            var result = context.MarkCancelled();
            if (result)
            {
                _logger.LogInformation("Job {JobId} transitioned to Cancelled after background worker terminated", jobId);
            }
            return result;
        }
        return false;
    }

    public void CompleteJob(string jobId)
    {
        if (string.IsNullOrWhiteSpace(jobId)) return;
        if (_jobs.TryRemove(jobId, out var context))
        {
            context.Complete();
            var finalStatus = context.Status;

            var snapshot = new CompletedTaxCalculationJobContext(
                context.JobId,
                context.EntityType,
                context.SocietyDetailId,
                context.WingDetailId,
                context.TotalUnits,
                context.ProcessedUnits,
                context.CurrentPropertyId,
                context.CreatedByUserId,
                finalStatus,
                context.IsCancellationRequested,
                DateTime.UtcNow);

            PruneCompletedJobsIfNeeded();
            _completedJobs[jobId] = snapshot;

            // Dispose active execution context and CTS to free resources
            context.Dispose();
            _logger.LogInformation("Job {JobId} completed with final status {Status}, active resources disposed and retained in completed store.", jobId, finalStatus);
        }
    }

    private void PruneCompletedJobsIfNeeded()
    {
        var now = DateTime.UtcNow;
        if (_completedJobs.Count >= MaxCompletedJobs)
        {
            foreach (var kvp in _completedJobs)
            {
                if (now - kvp.Value.CompletedAt > _retentionWindow)
                {
                    _completedJobs.TryRemove(kvp.Key, out _);
                }
            }

            if (_completedJobs.Count >= MaxCompletedJobs)
            {
                var oldestKeys = _completedJobs
                    .OrderBy(kvp => kvp.Value.CompletedAt)
                    .Take(_completedJobs.Count - MaxCompletedJobs + 1)
                    .Select(kvp => kvp.Key)
                    .ToList();

                foreach (var key in oldestKeys)
                {
                    _completedJobs.TryRemove(key, out _);
                }
            }
        }
    }
}
