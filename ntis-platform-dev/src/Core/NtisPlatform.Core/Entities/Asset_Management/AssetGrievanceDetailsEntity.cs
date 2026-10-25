using System;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Core.Entities.Asset_Management;

public class AssetGrievanceDetailsEntity : BaseEntity, IHardDeletable
{
    public string GrievanceNo { get; set; } = null!;
    public int GrievanceTypeId { get; set; }
    public int AssetId { get; set; }

    /// <summary>Physical table of the child record this ticket corrects (e.g. "AMS.AssetLeaseRentDetails"); null for a general complaint with no structured correction.</summary>
    public string? TargetTableName { get; set; }

    /// <summary>Row id within TargetTableName; null when TargetTableName is null.</summary>
    public int? TargetRecordId { get; set; }

    public string Description { get; set; } = null!;

    /// <summary>"CITIZEN_PORTAL" | "COUNCIL_EMPLOYEE"</summary>
    public string RaisedByChannel { get; set; } = null!;

    /// <summary>FK CORE.UserMaster (citizen or employee). 0 = citizen-portal sentinel (no UserMaster row).</summary>
    public int RaisedByUserId { get; set; }

    public string? ApplicantName { get; set; }
    public string? ApplicantMobile { get; set; }
    public string? ApplicantEmail { get; set; }

    /// <summary>FK CORE.UserMaster, current owner (no history — reassignment just overwrites this).</summary>
    public int? AssignedToUserId { get; set; }

    /// <summary>
    /// Controlled workflow value — never settable directly via Create/Update DTOs (both omit this
    /// property on purpose). Only changes through AssetGrievanceDetailsService's transition methods
    /// (SubmitCorrectionAsync/VerifyAsync/SendBackAsync/ApproveAsync/RejectAsync/CloseAsync/
    /// ReopenAsync), which also enforce role-separation and write a GrievanceActionHistory row.
    /// </summary>
    public string WorkflowStatus { get; set; } = "Raised";

    /// <summary>Number of Correction->Verification->Approval rounds this ticket has been through. Starts at 1, increments on every SentBack->Correction or Reopen->Correction loop.</summary>
    public int CurrentCycleNo { get; set; } = 1;

    public string Priority { get; set; } = "NORMAL";

    public bool MarkedForDeletion { get; set; }
    public DateTime? MarkedForDeletionDate { get; set; }

    public virtual AssetGrievanceCategoryEntity? AssetGrievanceCategory { get; set; }
}
