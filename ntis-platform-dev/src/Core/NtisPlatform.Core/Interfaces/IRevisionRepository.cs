using NtisPlatform.Core.Entities.Revision;
using NtisPlatform.Core.Enums.Revision;
using NtisPlatform.Core.Models.Revision;

namespace NtisPlatform.Core.Interfaces;

/// <summary>
/// Data access for the Revision header/workflow tables (PTIS.RevisionMast / PTIS.RevisionPeriod).
///
/// Mixed EF/SP boundary by design (revision_api_rules.txt section 24 "Repository approach"):
/// atomic, multi-table, locked revision creation goes through the stored procedure
/// <c>PTIS.usp_Revision_Begin</c> (numbering, snapshot cloning across the ~20 revision tables, and
/// period generation all happen inside that one transaction under an app lock), while ordinary
/// header reads use EF Core against the same <c>ApplicationDbContext</c>.
/// </summary>
public interface IRevisionRepository
{
    /// <summary>
    /// True when the property's current workflow row (PropertyWorkflowDetails with
    /// CurrentStatus = true) is at stage <c>ApprovalByULB</c>. A revision may only be opened for
    /// such a property.
    /// </summary>
    Task<bool> IsPropertyAtApprovalByUlbAsync(int propertyId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Calls <c>PTIS.usp_Revision_EnsureBaseline</c>: if the property has no POSTED/current
    /// revision for the finance year, creates revision #1 (type INITIAL) and snapshots the CURRENT
    /// live details and tax into it, then marks it POSTED. Idempotent - does nothing if a baseline
    /// already exists. Must run BEFORE the live property or its tax is changed.
    /// </summary>
    Task<RevisionBaselineResult> EnsureBaselineAsync(
        int propertyId,
        int financeYearId,
        string calculationType,
        int? createdBy,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Calls <c>PTIS.usp_Revision_Begin</c> to atomically create a new RevisionMast (and, for
    /// PERIOD_WISE, its RevisionPeriod rows) as DRAFT. Does NOT touch any live
    /// PropertyMast/PropertyDetails row itself. For PERIOD_WISE only, it automatically captures a
    /// snapshot of the OLD period's current live state (via an internal call equivalent to
    /// <see cref="CaptureSnapshotAsync"/>) before any change is made; for HISTORY_ONLY it creates
    /// only the RevisionMast header - no snapshot exists yet. After Begin, the caller edits the
    /// live property through the normal property/RV-CV APIs, then calls
    /// <see cref="CaptureSnapshotAsync"/> to record the (now-updated) state.
    /// </summary>
    Task<RevisionBeginResult> BeginRevisionAsync(
        RevisionBeginParameters parameters,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Calls <c>PTIS.usp_Revision_CaptureSnapshot</c> to copy the current LIVE property state
    /// (PropertyMast/PropertyDetails and RV/CV calculation results) into the revision snapshot
    /// tables for the given revision/period. Write-once: throws (SQL error 51007) if a snapshot
    /// already exists for this (RevisionMastId, RevisionPeriodId) pair. Callers are expected to
    /// have already edited the live tables and re-run RV/CV calculation before calling this.
    /// </summary>
    Task<RevisionCaptureSnapshotResult> CaptureSnapshotAsync(
        RevisionCaptureSnapshotParameters parameters,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Calls <c>PTIS.usp_Revision_Post</c> to finalize a revision: for HISTORY_ONLY, traces the
    /// existing TransMast rows via RevisionTransMast; for PERIOD_WISE, aggregates the
    /// captured period snapshots and replaces the live PolicyTaxDetails/PolicyTaxDetailsCV/TransMast
    /// rows accordingly. Either way marks the revision POSTED and sets IsCurrent = 1 for it
    /// (unsetting IsCurrent on whatever was previously current for that property + finance year).
    /// POSTED revisions are immutable.
    /// </summary>
    Task<RevisionPostResult> PostAsync(
        long revisionMastId,
        int? approvedBy,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Transitions a CALCULATED revision to APPROVED status and records approval metadata.
    /// Revisions must be APPROVED before they can be POSTED.
    /// </summary>
    Task<RevisionMastEntity> ApproveAsync(
        long revisionMastId,
        int? approvedBy,
        CancellationToken cancellationToken = default);

    /// <summary>Loads a single revision header. Returns null when not found or soft-deleted.</summary>
    Task<RevisionMastEntity?> GetByIdAsync(long revisionId, CancellationToken cancellationToken = default);

    /// <summary>Loads the periods for a revision, ordered by <see cref="RevisionPeriodEntity.PeriodNo"/>.</summary>
    Task<List<RevisionPeriodEntity>> GetPeriodsAsync(long revisionId, CancellationToken cancellationToken = default);

    /// <summary>Paged revision history for a property, newest first.</summary>
    Task<(List<RevisionMastEntity> Items, int TotalCount)> GetHistoryAsync(
        int propertyId,
        int pageNumber,
        int pageSize,
        RevisionStatus? status,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// True when the property already has an open (DRAFT or CALCULATED) revision for the given
    /// finance year. Used to block a second concurrent draft (section 26). Phase 8 will relax this
    /// once multiple period-wise splits within the same finance year are supported.
    /// </summary>
    Task<bool> HasOpenRevisionAsync(
        int propertyId,
        int financeYearId,
        CancellationToken cancellationToken = default);
}
