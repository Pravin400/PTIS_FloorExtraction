using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.DTOs.Asset_Management.AssetGrievanceDocument;

namespace NtisPlatform.Application.DTOs.Asset_Management.AssetGrievanceDetails;

public class AssetGrievanceDetailsDto : BaseDtos
{
    public string GrievanceNo { get; set; } = null!;
    public int GrievanceTypeId { get; set; }
    public string? GrievanceCategoryName { get; set; }
    public int AssetId { get; set; }
    public string AssetNo { get; set; } = null!;
    public string? AssetName { get; set; }
    public Guid? AssetImageGuid { get; set; }
    public string Description { get; set; } = null!;
    public string RaisedByChannel { get; set; } = null!;
    public int RaisedByUserId { get; set; }
    public string? ApplicantName { get; set; }
    public string? ApplicantMobile { get; set; }
    public string? ApplicantEmail { get; set; }
    public int? AssignedToUserId { get; set; }
    public string WorkflowStatus { get; set; } = null!;
    public int CurrentCycleNo { get; set; }
    public string? TargetTableName { get; set; }
    public int? TargetRecordId { get; set; }
    public string Priority { get; set; } = null!;

    public List<AssetGrievanceDocumentResponseDto> Documents { get; set; } = new();
}

public class CreateAssetGrievanceDetailsDto : CreateBaseDtos
{
    public string? GrievanceNo { get; set; }
    public int GrievanceTypeId { get; set; }
    public int AssetId { get; set; }
    public string Description { get; set; } = null!;
    public string? RaisedByChannel { get; set; }
    public int? RaisedByUserId { get; set; }
    public string? ApplicantName { get; set; }
    public string? ApplicantMobile { get; set; }
    public string? ApplicantEmail { get; set; }
    public int? AssignedToUserId { get; set; }
    public string? TargetTableName { get; set; }
    public int? TargetRecordId { get; set; }
    public string? Priority { get; set; }
    public int? DepartmentId { get; set; }
    public int? ModuleId { get; set; }

    public List<Microsoft.AspNetCore.Http.IFormFile>? DocumentFiles { get; set; }
    public string? DocumentMetadataJson { get; set; }
}

public class UpdateAssetGrievanceDetailsDto : UpdateBaseDtos
{
    public string GrievanceNo { get; set; } = null!;
    public int GrievanceTypeId { get; set; }
    public int AssetId { get; set; }
    public string Description { get; set; } = null!;
    public string RaisedByChannel { get; set; } = null!;
    public int RaisedByUserId { get; set; }
    public string? ApplicantName { get; set; }
    public string? ApplicantMobile { get; set; }
    public string? ApplicantEmail { get; set; }
    public int? AssignedToUserId { get; set; }
    // WorkflowStatus is intentionally NOT here — it must only change via the dedicated transition
    // endpoints (verify/send-back/approve/reject/close/reopen), which enforce role-separation and
    // valid-transition rules and write a GrievanceActionHistory row. A plain field on this DTO would
    // let any caller jump the status directly, bypassing all of that with no audit trail.
    public string? TargetTableName { get; set; }
    public int? TargetRecordId { get; set; }
    public string? Priority { get; set; }
    public int? DepartmentId { get; set; }
    public int? ModuleId { get; set; }

    public List<Microsoft.AspNetCore.Http.IFormFile>? DocumentFiles { get; set; }
    public string? DocumentMetadataJson { get; set; }
}

public class AssetGrievanceDetailsQueryParameters : BaseQueryParameters
{
    [Filterable(FilterOperator.Equals)]
    public string? GrievanceNo { get; set; }

    [Filterable(FilterOperator.Equals)]
    public string? WorkflowStatus { get; set; }

    [Filterable(FilterOperator.Equals)]
    public bool? IsActive { get; set; } = true;
}

/// <summary>Body for verify/forward/approve/close — a workflow step with an optional remark and optional stage routing parameters.</summary>
public class AssetGrievanceWorkflowActionDto
{
    [StringLength(1000, ErrorMessage = "Grievance_Remarks_MaxLen_1000")]
    public string? Remarks { get; set; }

    /// <summary>Optional target StageId to explicitly forward to a specific workflow stage.</summary>
    public int? NextStageId { get; set; }

    /// <summary>Optional ULB Type Id (1 = Corporation, 2 = Council, etc.) to evaluate workflow configuration.</summary>
    public int? UlbTypeId { get; set; }
}

/// <summary>Body for send-back/reject/reopen — a workflow step that must be justified.</summary>
public class AssetGrievanceReasonActionDto
{
    [Required(ErrorMessage = "Grievance_Reason_Required")]
    [StringLength(1000, ErrorMessage = "Grievance_Reason_MaxLen_1000")]
    public string Reason { get; set; } = string.Empty;
}

/// <summary>
/// A correction officer's submission: which target row, and the new value for each field being
/// corrected. The "before" snapshot is never accepted from the client — the service reads the live
/// row itself so BeforeData can't be falsified.
/// </summary>
public class SubmitAssetGrievanceCorrectionDto
{
    [Required(ErrorMessage = "Grievance_TargetTableName_Required")]
    public string TargetTableName { get; set; } = string.Empty;

    public int? RecordId { get; set; }

    public string? Remarks { get; set; }

    [Required(ErrorMessage = "Grievance_FieldValues_Required")]
    public Dictionary<string, string> FieldValues { get; set; } = new();
}

public class AssetGrievanceCorrectionDetailDto
{
    public int Id { get; set; }
    public int GrievanceDetailsId { get; set; }
    public string TargetTableName { get; set; } = null!;
    public int? RecordId { get; set; }
    public string? BeforeData { get; set; }
    public string AfterData { get; set; } = null!;
    public int ProposedBy { get; set; }
    public DateTime ProposedDate { get; set; }
    public bool IsApplied { get; set; }
    public DateTime? AppliedDate { get; set; }
    public bool IsActive { get; set; }
}

public class AssetGrievanceActionHistoryDto
{
    public int Id { get; set; }
    public int GrievanceDetailsId { get; set; }
    public int CycleNo { get; set; }
    public string Action { get; set; } = null!;
    public string PreviousWorkflowStatus { get; set; } = null!;
    public string NewWorkflowStatus { get; set; } = null!;
    public int ActionBy { get; set; }
    public DateTime ActionDate { get; set; }
    public string? Remarks { get; set; }
}

/// <summary>
/// Citizen-facing projection of AssetGrievanceDetailsDto — deliberately omits AssignedToUserId
/// (citizens see WorkflowStatus/dates/remarks, never which employee currently owns the ticket).
/// </summary>
public class AssetCitizenGrievanceDto
{
    public int Id { get; set; }
    public string GrievanceNo { get; set; } = null!;
    public int GrievanceTypeId { get; set; }
    public string? GrievanceCategoryName { get; set; }
    public int AssetId { get; set; }
    public string AssetNo { get; set; } = null!;
    public string? AssetName { get; set; }
    public string Description { get; set; } = null!;
    public string ApplicantName { get; set; } = null!;
    public string ApplicantMobile { get; set; } = null!;
    public string? ApplicantEmail { get; set; }
    public string WorkflowStatus { get; set; } = null!;
    public int CurrentCycleNo { get; set; }
    public string Priority { get; set; } = null!;
    public DateTime? CreatedDate { get; set; }
    public List<AssetGrievanceDocumentResponseDto> Documents { get; set; } = new();
}

/// <summary>Grievance-queue counts by workflow stage, for a dashboard widget.</summary>
public class AssetGrievanceDashboardStatsDto
{
    public int TotalApplications { get; set; }

    /// <summary>Raised or SentBack — awaiting a correction submission.</summary>
    public int CorrectionPending { get; set; }

    /// <summary>CorrectionDone — awaiting Verify/SendBack.</summary>
    public int VerificationPending { get; set; }

    /// <summary>Verified — awaiting Approve/Reject.</summary>
    public int ApprovalPending { get; set; }

    /// <summary>Resolved — approved and applied.</summary>
    public int ApprovalDone { get; set; }

    public int Rejected { get; set; }
    public int Closed { get; set; }
}
