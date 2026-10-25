using NtisPlatform.Core.Entities.Revision;

namespace NtisPlatform.Core.Interfaces;

/// <summary>
/// Data access for the Phase 2a "core property snapshot" group (RevisionPropertyMast and its 1:1
/// children RevisionPropertyMastDetails,
/// plus the RevisionPropertyDetails floor-wise child rows). Kept separate from
/// <see cref="IRevisionRepository"/> (Phase 1's header/period repository) so later phases can add
/// their own snapshot-group repositories without this one growing unbounded.
/// </summary>
public interface IRevisionPropertySnapshotRepository
{
    /// <summary>
    /// Loads the revision header (tracked, for in-place status mutation by
    /// <see cref="IRevisionDraftGuardService"/>) with its periods ordered by PeriodNo, for an edit
    /// operation. Unlike <c>IRevisionRepository.GetByIdAsync</c> (AsNoTracking, read-only), this
    /// entity is meant to be mutated and saved via <see cref="SaveChangesAsync"/>.
    /// </summary>
    Task<RevisionMastEntity?> GetRevisionForEditAsync(long revisionMastId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Loads the single editable RevisionPropertyMast snapshot row for a revision: the row with
    /// <paramref name="revisionPeriodId"/> = null for a HISTORY_ONLY revision, or the row for the
    /// latest period for a PERIOD_WISE revision (caller resolves which period id that is from
    /// <see cref="GetRevisionForEditAsync"/>'s Periods). Tracked, with its 1:1 children included.
    /// </summary>
    Task<RevisionPropertyMastEntity?> GetPropertyMastAsync(
        long revisionMastId, long? revisionPeriodId, CancellationToken cancellationToken = default);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
