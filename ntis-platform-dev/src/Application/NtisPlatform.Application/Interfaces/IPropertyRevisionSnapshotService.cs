using NtisPlatform.Application.DTOs.PropertyRevision;

namespace NtisPlatform.Application.Interfaces;

/// <summary>
/// Phase 2a draft-editing for the "core property snapshot" group. Reads/writes only the
/// Revision* snapshot tables - the live PropertyMast/PropertyDetails rows are never touched while
/// a revision is DRAFT or CALCULATED (revision_api_rules.txt / REVISION LOGIC.txt section 4).
/// Starts with RevisionPropertyMast; RevisionPropertyDetails and the remaining Phase 2 tables
/// (Renter/Room/Social/Certificates/Photo/ApplyTaxes) follow in later phases.
/// </summary>
public interface IPropertyRevisionSnapshotService
{
    /// <exception cref="Core.Exceptions.RevisionNotFoundException">No such revision.</exception>
    /// <exception cref="Core.Exceptions.RevisionConflictException">The revision has no editable snapshot row (should not happen for a revision usp_Revision_Begin created correctly).</exception>
    Task<RevisionPropertyMastDto> GetPropertyMastAsync(long revisionId, CancellationToken cancellationToken = default);

    /// <exception cref="Core.Exceptions.RevisionNotFoundException">No such revision.</exception>
    /// <exception cref="Core.Exceptions.RevisionConflictException">
    /// The revision is APPROVED/POSTED/CANCELLED (immutable), or is PERIOD_WISE with no periods yet,
    /// or has no editable snapshot row.
    /// </exception>
    Task<UpdateRevisionPropertyMastResultDto> UpdatePropertyMastAsync(
        long revisionId, UpdateRevisionPropertyMastDto request, CancellationToken cancellationToken = default);
}
