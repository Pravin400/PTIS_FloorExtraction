using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Core.Entities.Asset_Management;

/// <summary>
/// One verify/send-back/approve/reject/close/reopen event on a grievance ticket. A ticket can go
/// through Verification and Approval more than once (send-back loops back to Correction; a
/// closed/resolved/rejected ticket can be reopened), so this table is the only place the full
/// per-cycle remark history lives — GrievanceDetails.Status/CurrentCycleNo only ever reflect the
/// current/latest cycle. Maps to [AMS].[GrievanceActionHistory].
/// </summary>
public class AssetGrievanceActionHistoryEntity : BaseEntity, IHardDeletable
{
    public int GrievanceDetailsId { get; set; }

    /// <summary>Matches GrievanceDetails.CurrentCycleNo at the time this action was taken.</summary>
    public int CycleNo { get; set; }

    public string Action { get; set; } = null!;
    public string PreviousWorkflowStatus { get; set; } = null!;
    public string NewWorkflowStatus { get; set; } = null!;
    public int ActionBy { get; set; }
    public DateTime ActionDate { get; set; }
    public string? Remarks { get; set; }

    public bool MarkedForDeletion { get; set; }
    public DateTime? MarkedForDeletionDate { get; set; }

    public virtual AssetGrievanceDetailsEntity? GrievanceDetails { get; set; }
}
