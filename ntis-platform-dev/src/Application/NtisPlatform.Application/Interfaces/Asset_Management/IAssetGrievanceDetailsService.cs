using NtisPlatform.Application.DTOs.Asset_Management.AssetGrievanceDetails;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities.Asset_Management;

namespace NtisPlatform.Application.Interfaces.Asset_Management;

public interface IAssetGrievanceDetailsService :
    ICommonCrudService<
        AssetGrievanceDetailsEntity,
        AssetGrievanceDetailsDto,
        CreateAssetGrievanceDetailsDto,
        UpdateAssetGrievanceDetailsDto,
        AssetGrievanceDetailsQueryParameters,
        int>
{
    /// <summary>
    /// Correction officer submits the field values to correct on the ticket's target row. Reads the
    /// live row itself for BeforeData (never trusts a client-supplied "before" snapshot), inserts a
    /// GrievanceCorrectionDetail row, and transitions Raised|SentBack -> CorrectionDone.
    /// </summary>
    Task<AssetGrievanceDetailsDto?> SubmitCorrectionAsync(int id, SubmitAssetGrievanceCorrectionDto dto, int userId, CancellationToken cancellationToken = default);

    /// <summary>CorrectionDone -> Verified. Rejects if userId proposed the correction being verified.</summary>
    Task<AssetGrievanceDetailsDto?> VerifyAsync(int id, string? remarks, int userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Dynamically forwards the grievance ticket to the next workflow stage (or final approval if at the last stage).
    /// Supports multi-level intermediate stages without hardcoded status restrictions.
    /// </summary>
    Task<AssetGrievanceDetailsDto?> ForwardAsync(int id, AssetGrievanceWorkflowActionDto? dto, int userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// CorrectionDone -> SentBack. Increments CurrentCycleNo and marks this cycle's
    /// GrievanceCorrectionDetail rows IsActive = 0 (superseded, not deleted) so the correction
    /// officer must resubmit for the new cycle.
    /// </summary>
    Task<AssetGrievanceDetailsDto?> SendBackAsync(int id, string reason, int userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Verified -> Resolved. Applies every un-applied active GrievanceCorrectionDetail row for this
    /// ticket to its live target table via a matching IAssetGrievanceCorrectionApplier. Rejects if
    /// userId is this cycle's correction officer or verifier.
    /// </summary>
    Task<AssetGrievanceDetailsDto?> ApproveAsync(int id, string? remarks, int userId, CancellationToken cancellationToken = default);

    /// <summary>Verified -> Rejected. History row only, no live-data change.</summary>
    Task<AssetGrievanceDetailsDto?> RejectAsync(int id, string reason, int userId, CancellationToken cancellationToken = default);

    /// <summary>Resolved|Rejected -> Closed.</summary>
    Task<AssetGrievanceDetailsDto?> CloseAsync(int id, string? remarks, int userId, CancellationToken cancellationToken = default);

    /// <summary>Closed|Resolved|Rejected -> Raised. Increments CurrentCycleNo.</summary>
    Task<AssetGrievanceDetailsDto?> ReopenAsync(int id, string reason, int userId, CancellationToken cancellationToken = default);

    /// <summary>Full cross-cycle action history for one ticket, newest first.</summary>
    Task<List<AssetGrievanceActionHistoryDto>> GetActionHistoryAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>Full cross-cycle correction detail rows for one ticket (including superseded ones), newest first.</summary>
    Task<List<AssetGrievanceCorrectionDetailDto>> GetCorrectionDetailsAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Hard-removes this ticket's GrievanceCorrectionDetail/GrievanceActionHistory/AssetGrievanceDocument
    /// rows (their FKs to GrievanceDetails are Restrict, so a purge of the ticket itself would
    /// otherwise fail). Call before purging the GrievanceDetails row. Evidence-document files are only
    /// deactivated, not destroyed — the existing retention pipeline handles actual cleanup.
    /// </summary>
    Task PurgeChildrenAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Proposes a PHOTO/DOCUMENT ADD/REPLACE/DELETE for the ticket's asset. Valid only from
    /// Raised|SentBack (same cycle state as SubmitCorrectionAsync). Applied automatically inside
    /// ApproveAsync's transaction — no separate approve/apply step.
    /// </summary>
    Task<AssetGrievanceMediaCorrectionDto> SubmitMediaCorrectionAsync(int id, SubmitAssetGrievanceMediaCorrectionDto dto, int userId, CancellationToken cancellationToken = default);

    /// <summary>Full cross-cycle media-correction rows for one ticket, newest first.</summary>
    Task<List<AssetGrievanceMediaCorrectionDto>> GetMediaCorrectionsAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>Withdraws (soft-deactivates) a still-unapplied media-correction proposal.</summary>
    Task<bool> WithdrawMediaCorrectionAsync(int id, int mediaCorrectionId, int userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Same as <see cref="Interfaces.ICommonCrudService{TEntity,TDto,TCreateDto,TUpdateDto,TQueryParams,TKey}.GetAllAsync"/>,
    /// but restricted to <paramref name="currentUserId"/>'s allowed owning departments (see IAssetAccessScopeService).
    /// </summary>
    Task<PagedResult<AssetGrievanceDetailsDto>> GetAllForUserAsync(AssetGrievanceDetailsQueryParameters qp, int currentUserId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Same as GetByIdAsync, but returns null if the ticket's asset's owning department is outside
    /// currentUserId's allowed scope (prevents IDOR).
    /// </summary>
    Task<AssetGrievanceDetailsDto?> GetByIdForUserAsync(int id, int currentUserId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Queue counts by workflow stage (Total/CorrectionPending/VerificationPending/ApprovalPending/
    /// ApprovalDone/Rejected/Closed), scoped to currentUserId's allowed owning departments the same
    /// way GetAllForUserAsync is.
    /// </summary>
    Task<AssetGrievanceDashboardStatsDto> GetDashboardStatsAsync(int currentUserId, CancellationToken cancellationToken = default);

    // --- Citizen-portal surface: scoped by ApplicantMobile, not RaisedByUserId (citizens have no CORE.UserMaster row) ---

    Task<AssetCitizenGrievanceDto> CreateForCitizenAsync(CreateAssetGrievanceDetailsDto dto, string mobileNo, CancellationToken cancellationToken = default);
    Task<PagedResult<AssetCitizenGrievanceDto>> GetAllForCitizenAsync(AssetGrievanceDetailsQueryParameters qp, string mobileNo, CancellationToken cancellationToken = default);
    Task<AssetCitizenGrievanceDto?> GetByIdForCitizenAsync(int id, string mobileNo, CancellationToken cancellationToken = default);
    Task<AssetCitizenGrievanceDto?> CloseForCitizenAsync(int id, string? remarks, string mobileNo, CancellationToken cancellationToken = default);
    Task<AssetCitizenGrievanceDto?> ReopenForCitizenAsync(int id, string reason, string mobileNo, CancellationToken cancellationToken = default);
}
