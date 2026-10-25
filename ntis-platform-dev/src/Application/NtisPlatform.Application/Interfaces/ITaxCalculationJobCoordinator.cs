using NtisPlatform.Application.DTOs.PropertyCertificate;

namespace NtisPlatform.Application.Interfaces;

/// <summary>
/// Status lifecycle of a background tax recalculation job.
/// </summary>
public enum TaxCalculationJobStatus
{
    Pending,
    Processing,
    Paused,
    Cancelling,
    Cancelled,
    Completed,
    Failed
}

/// <summary>
/// Manages execution state, pause signals, and cancellation tokens for background tax calculation jobs.
/// </summary>
public interface ITaxCalculationJobCoordinator
{
    /// <summary>
    /// Registers a new active background job with cancellation and pause primitives.
    /// </summary>
    ITaxCalculationJobContext RegisterJob(
        string jobId,
        string entityType,
        int? societyDetailId,
        int? wingDetailId,
        int totalUnits,
        int createdByUserId,
        CancellationToken parentToken = default);

    /// <summary>
    /// Retrieves the job execution context by JobId.
    /// </summary>
    ITaxCalculationJobContext? GetJob(string jobId);

    /// <summary>
    /// Pauses an in-progress calculation job.
    /// </summary>
    bool PauseJob(string jobId);

    /// <summary>
    /// Resumes a paused calculation job.
    /// </summary>
    bool ResumeJob(string jobId);

    /// <summary>
    /// Cancels and terminates an in-progress or paused calculation job.
    /// Transitions state to Cancelling and triggers cancellation token.
    /// </summary>
    bool CancelJob(string jobId);

    /// <summary>
    /// Marks the job as cancelled once background execution has stopped.
    /// </summary>
    bool MarkJobCancelled(string jobId);

    /// <summary>
    /// Marks the job as finished and cleans up resources.
    /// </summary>
    void CompleteJob(string jobId);
}

/// <summary>
/// Thread-safe execution context for an active background tax calculation job.
/// </summary>
public interface ITaxCalculationJobContext
{
    string JobId { get; }
    string EntityType { get; }
    int? SocietyDetailId { get; }
    int? WingDetailId { get; }
    int TotalUnits { get; }
    int CreatedByUserId { get; }
    int ProcessedUnits { get; set; }
    int CurrentPropertyId { get; set; }
    TaxCalculationJobStatus Status { get; }
    bool IsCancellationRequested { get; }
    bool IsPaused { get; }

    /// <summary>
    /// Asynchronously pauses the worker thread if the job is in a Paused state until resumed or cancelled.
    /// </summary>
    Task WaitIfPausedAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Pauses execution. Returns true if state transitioned to Paused.
    /// </summary>
    bool Pause();

    /// <summary>
    /// Resumes execution. Returns true if state transitioned to Processing.
    /// </summary>
    bool Resume();

    /// <summary>
    /// Requests cancellation of execution. Returns true if state transitioned to Cancelling.
    /// </summary>
    bool Cancel();

    /// <summary>
    /// Transitions state to Cancelled once the background worker has actually terminated.
    /// </summary>
    bool MarkCancelled();

    /// <summary>
    /// Finalizes the job execution status upon completion or termination.
    /// </summary>
    void Complete(TaxCalculationJobStatus finalStatus = TaxCalculationJobStatus.Completed);
}
