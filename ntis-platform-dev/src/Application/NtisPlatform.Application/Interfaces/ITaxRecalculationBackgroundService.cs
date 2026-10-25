using NtisPlatform.Application.DTOs.PropertyCertificate;

namespace NtisPlatform.Application.Interfaces;

/// <summary>
/// Service to enqueue and process tax recalculation jobs asynchronously in the background.
/// Prevents long-running member unit loops from blocking HTTP request threads.
/// </summary>
public interface ITaxRecalculationBackgroundService
{
    /// <summary>
    /// Enqueues recalculation for all units under a Society or Wing, returning immediately with a JobId.
    /// </summary>
    Task<string> EnqueueSocietyOrWingRecalculationAsync(
        string entityType,
        int? societyDetailId,
        int? wingDetailId,
        int userId,
        int certificateTypeId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Enqueues recalculation for a list of property IDs, returning immediately with a JobId.
    /// </summary>
    Task<string> EnqueuePropertyRecalculationAsync(
        List<int> propertyIds,
        int? societyDetailId,
        int? wingDetailId,
        int userId,
        int certificateTypeId,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Broadcaster interface to stream tax calculation progress and completion events via SignalR.
/// </summary>
public interface ITaxCalculationNotifier
{
    Task NotifyProgressAsync(TaxCalculationProgressDto progress, CancellationToken cancellationToken = default);
    Task NotifyCompletedAsync(TaxCalculationCompletedDto completed, CancellationToken cancellationToken = default);
}
