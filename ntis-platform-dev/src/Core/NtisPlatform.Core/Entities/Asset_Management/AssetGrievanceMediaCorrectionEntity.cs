using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Core.Entities.Asset_Management;

/// <summary>
/// One proposed non-destructive media change (photo or document) on a grievance's asset —
/// replaces the old "AMS.AssetPhoto via SubmitCorrectionAsync FieldValues" special case with a
/// dedicated, strongly-typed table. IsApproved and IsApplied are set together at Approve time
/// (mirrors GrievanceCorrectionDetail.IsApplied — no separate approve/apply steps).
/// Maps to [AMS].[GrievanceMediaCorrection].
/// </summary>
public class AssetGrievanceMediaCorrectionEntity : BaseEntity, IHardDeletable
{
    public int GrievanceId { get; set; }
    public string TargetMediaType { get; set; } = null!;   // "PHOTO" | "DOCUMENT"
    public string ActionType { get; set; } = null!;         // "ADD" | "REPLACE" | "DELETE"
    public int? ExistingMediaRecordId { get; set; }
    public int? PhotoTypeId { get; set; }
    public int? DocumentDefinitionId { get; set; }
    public int? NewDocumentBindingId { get; set; }
    public string? Remarks { get; set; }
    public bool IsApproved { get; set; }
    public bool IsApplied { get; set; }
    public DateTime? AppliedDate { get; set; }

    public bool MarkedForDeletion { get; set; }
    public DateTime? MarkedForDeletionDate { get; set; }

    public virtual AssetGrievanceDetailsEntity? Grievance { get; set; }
}
