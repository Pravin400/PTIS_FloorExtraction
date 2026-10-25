using NtisPlatform.Core.Entities.GrievanceEntities;

namespace NtisPlatform.Application.Interfaces.GrievanceInterface;

/// <summary>
/// Domain-level contract for dispatching WhatsApp notifications for Grievance events.
/// Decoupled from transport specifics; focuses strictly on business entities.
/// </summary>
public interface IGrievanceWhatsAppNotificationService
{
    /// <summary>
    /// Sends a WhatsApp confirmation message to the citizen upon grievance application submission.
    /// </summary>
    /// <param name="application">The persisted grievance application entity.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>True if successfully queued or accepted; false otherwise.</returns>
    Task<bool> SendGrievanceSubmissionWhatsAppNotificationAsync(
        GrievanceApplicationEntity application,
        CancellationToken cancellationToken = default);
}
