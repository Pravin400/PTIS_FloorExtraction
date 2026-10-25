using NtisPlatform.Application.DTOs.PropertyRevision;
using NtisPlatform.Application.Models;

namespace NtisPlatform.Application.Interfaces;

/// <summary>
/// Phase 1 of the Property Revision module: opening a revision (which clones the current live
/// property into revision snapshot tables via <c>PTIS.usp_Revision_Begin</c> without touching the
/// live tables) and reading it back. Draft editing, calculation, approval and posting are Phase
/// 2+ (revision_api_rules.txt section 30).
/// </summary>
public interface IPropertyRevisionService
{
    /// <summary>
    /// Saves the property's current (pre-change) details and tax as the initial assessment for the
    /// finance year (<c>PTIS.usp_Revision_EnsureBaseline</c>). Idempotent. Also called
    /// automatically by <see cref="CreateAsync"/>.
    /// </summary>
    /// <exception cref="Core.Exceptions.PropertyNotFoundException">Property does not exist.</exception>
    /// <exception cref="Core.Exceptions.RevisionValidationException">Finance year does not exist.</exception>
    /// <exception cref="Core.Exceptions.RevisionConflictException">A revision is already open.</exception>
    Task<RevisionBaselineDto> EnsureBaselineAsync(
        int propertyId,
        EnsureRevisionBaselineDto request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Opens a new DRAFT revision for <paramref name="propertyId"/>.
    /// </summary>
    /// <exception cref="Core.Exceptions.PropertyNotFoundException">Property does not exist.</exception>
    /// <exception cref="Core.Exceptions.RevisionValidationException">
    /// Finance year does not exist, or the effective-date/scope combination is invalid.
    /// </exception>
    /// <exception cref="Core.Exceptions.RevisionConflictException">
    /// The property already has an open (DRAFT/CALCULATED) revision for this finance year.
    /// </exception>
    Task<PropertyRevisionCreatedDto> CreateAsync(
        int propertyId,
        CreatePropertyRevisionDto request,
        CancellationToken cancellationToken = default);

    /// <summary>Loads a single revision's header and periods.</summary>
    /// <exception cref="Core.Exceptions.RevisionNotFoundException">No such revision.</exception>
    Task<PropertyRevisionDetailsDto> GetAsync(
        long revisionId,
        CancellationToken cancellationToken = default);

    /// <summary>Paged revision history for a property, newest revision first.</summary>
    /// <exception cref="Core.Exceptions.PropertyNotFoundException">Property does not exist.</exception>
    Task<PagedResult<PropertyRevisionSummaryDto>> GetHistoryAsync(
        int propertyId,
        PropertyRevisionQueryParameters query,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Copies the current LIVE property state into the revision's snapshot tables
    /// (<c>PTIS.usp_Revision_CaptureSnapshot</c>). Call this only after editing the live property
    /// through the normal property API and re-running RV/CV calculation - this does not read or
    /// change live data itself, it snapshots whatever is live right now.
    /// </summary>
    /// <exception cref="Core.Exceptions.RevisionNotFoundException">No such revision.</exception>
    /// <exception cref="Core.Exceptions.RevisionValidationException">
    /// Scope/period-id combination is invalid (e.g. RevisionPeriodId supplied for HISTORY_ONLY, or
    /// missing/unresolvable for PERIOD_WISE).
    /// </exception>
    /// <exception cref="Core.Exceptions.RevisionConflictException">
    /// The revision is not DRAFT/CALCULATED (already posted/cancelled), or a snapshot already
    /// exists for this revision/period (write-once).
    /// </exception>
    Task<RevisionSnapshotCapturedDto> CaptureSnapshotAsync(
        long revisionId,
        CaptureRevisionSnapshotDto request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Approves a revision that is in CALCULATED status. Must be approved before posting.
    /// </summary>
    /// <exception cref="Core.Exceptions.RevisionNotFoundException">No such revision.</exception>
    /// <exception cref="Core.Exceptions.RevisionConflictException">The revision is not CALCULATED.</exception>
    Task<PropertyRevisionDetailsDto> ApproveAsync(
        long revisionId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Finalizes the revision (<c>PTIS.usp_Revision_Post</c>): traces or replaces live
    /// PolicyTaxDetails/TransMast from the captured snapshot(s), marks the revision POSTED and
    /// IsCurrent for its property + finance year. Immutable afterwards.
    /// </summary>
    /// <exception cref="Core.Exceptions.RevisionNotFoundException">No such revision.</exception>
    /// <exception cref="Core.Exceptions.RevisionConflictException">
    /// The revision is not APPROVED, or has no captured snapshot yet.
    /// </exception>
    Task<RevisionPostedDto> PostAsync(
        long revisionId,
        CancellationToken cancellationToken = default);
}
