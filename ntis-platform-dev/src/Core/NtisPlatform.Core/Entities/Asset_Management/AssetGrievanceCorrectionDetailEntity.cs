using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Core.Entities.Asset_Management;

/// <summary>
/// One correction operation on a grievance's target record. Written only at Correction time and
/// never edited afterwards — Verification/Approval only ever review what this row already holds.
/// A ticket sent back or reopened gets a fresh row each cycle; the superseded row is IsActive = 0,
/// never deleted, so the full correction history across every cycle is preserved.
/// Maps to [AMS].[GrievanceCorrectionDetail].
/// </summary>
public class AssetGrievanceCorrectionDetailEntity : BaseEntity, IHardDeletable
{
    public int GrievanceDetailsId { get; set; }
    public string TargetTableName { get; set; } = null!;
    public int? RecordId { get; set; }

    /// <summary>Full JSON snapshot of the target row read live at Correction time. Null only when RecordId is null (unsupported INSERT case).</summary>
    public string? BeforeData { get; set; }

    /// <summary>Full JSON snapshot of the target row with the proposed correction applied.</summary>
    public string AfterData { get; set; } = null!;

    public int ProposedBy { get; set; }
    public DateTime ProposedDate { get; set; }
    public bool IsApplied { get; set; }
    public DateTime? AppliedDate { get; set; }

    public bool MarkedForDeletion { get; set; }
    public DateTime? MarkedForDeletionDate { get; set; }

    public virtual AssetGrievanceDetailsEntity? GrievanceDetails { get; set; }
}
