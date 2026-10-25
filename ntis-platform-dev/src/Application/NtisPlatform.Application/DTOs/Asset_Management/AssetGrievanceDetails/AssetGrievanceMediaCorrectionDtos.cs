using System.ComponentModel.DataAnnotations;

namespace NtisPlatform.Application.DTOs.Asset_Management.AssetGrievanceDetails;

/// <summary>
/// A proposed non-destructive media change (photo or document) on a grievance's asset.
/// Replaces the old "AMS.AssetPhoto via SubmitCorrectionAsync FieldValues" special case.
/// </summary>
public class SubmitAssetGrievanceMediaCorrectionDto
{
    [Required(ErrorMessage = "GrievanceMedia_TargetMediaType_Required")]
    public string TargetMediaType { get; set; } = null!;   // "PHOTO" | "DOCUMENT"

    [Required(ErrorMessage = "GrievanceMedia_ActionType_Required")]
    public string ActionType { get; set; } = null!;         // "ADD" | "REPLACE" | "DELETE"

    public int? ExistingMediaRecordId { get; set; }
    public int? PhotoTypeId { get; set; }
    public int? DocumentDefinitionId { get; set; }
    public int? NewDocumentBindingId { get; set; }

    [StringLength(500, ErrorMessage = "GrievanceMedia_Remarks_MaxLen_500")]
    public string? Remarks { get; set; }
}

public class AssetGrievanceMediaCorrectionDto
{
    public int Id { get; set; }
    public int GrievanceId { get; set; }
    public string TargetMediaType { get; set; } = null!;
    public string ActionType { get; set; } = null!;
    public int? ExistingMediaRecordId { get; set; }
    public int? PhotoTypeId { get; set; }
    public int? DocumentDefinitionId { get; set; }
    public int? NewDocumentBindingId { get; set; }
    public string? Remarks { get; set; }
    public bool IsApproved { get; set; }
    public bool IsApplied { get; set; }
    public DateTime? AppliedDate { get; set; }
    public bool IsActive { get; set; }
    public DateTime? CreatedDate { get; set; }
}
