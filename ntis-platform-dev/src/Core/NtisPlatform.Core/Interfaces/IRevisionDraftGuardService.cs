using NtisPlatform.Core.Entities.Revision;

namespace NtisPlatform.Core.Interfaces;

/// <summary>
/// Shared, cross-cutting enforcement of two rules that every Phase 2+ draft-editing endpoint must
/// apply identically (revision_api_rules.txt / REVISION LOGIC.txt sections 8, 19) rather than
/// re-implementing per endpoint:
///
/// 1. A revision can only be edited while DRAFT or CALCULATED - APPROVED/POSTED/CANCELLED are
///    immutable (<see cref="EnsureEditable"/>).
/// 2. Editing a tax-relevant field while the revision is CALCULATED must silently reset it back to
///    DRAFT and clear any stale calculation rows, so a later Calculate never mixes results from two
///    different snapshots (<see cref="ApplyIfTaxRelevantFieldChangedAsync"/>).
///
/// Each edit service is responsible for knowing which of ITS OWN fields are tax-relevant (the set
/// differs per snapshot table) and for diffing old vs. new values; this service only owns the
/// resulting state transition + cleanup dispatch, so that logic is written exactly once.
/// </summary>
public interface IRevisionDraftGuardService
{
    /// <summary>
    /// Throws <see cref="Exceptions.RevisionConflictException"/> if <paramref name="revision"/> is
    /// not currently editable (APPROVED, POSTED, or CANCELLED).
    /// </summary>
    void EnsureEditable(RevisionMastEntity revision);

    /// <summary>
    /// If <paramref name="anyTaxRelevantFieldChanged"/> is true and the revision is currently
    /// CALCULATED, resets <paramref name="revision"/>.RevisionStatus to DRAFT (mutating the tracked
    /// entity in place - the caller's SaveChangesAsync persists it) and invokes every registered
    /// <see cref="IRevisionCalculationCleanupHandler"/> to clear that revision's stale calculation
    /// rows. No-ops (returns false) if the revision was already DRAFT, or if no tax-relevant field
    /// changed. Does not itself validate editability - call <see cref="EnsureEditable"/> first.
    /// </summary>
    /// <returns>True if the revision was reset from CALCULATED to DRAFT.</returns>
    Task<bool> ApplyIfTaxRelevantFieldChangedAsync(
        RevisionMastEntity revision,
        bool anyTaxRelevantFieldChanged,
        CancellationToken cancellationToken = default);
}
