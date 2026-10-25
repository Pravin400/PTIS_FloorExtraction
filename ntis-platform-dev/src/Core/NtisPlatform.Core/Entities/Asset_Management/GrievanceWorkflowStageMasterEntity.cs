using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Core.Entities.Asset_Management
{
    /// <summary>
    /// Entity representing dynamic workflow stages for Grievance Redressal (Correction -> Verification -> Approval).
    /// Configured per ULB Type (e.g. Corporation has 4 stages, Council has 3 stages).
    /// Maps to [AMS].[GrievanceWorkflowStageMaster]
    /// </summary>
    public class GrievanceWorkflowStageMasterEntity : BaseEntity, IHardDeletable
    {
        public int UlbTypeId { get; set; }
        public string StageCode { get; set; } = null!;
        public string StageName { get; set; } = null!;
        public string? StageNameLocal { get; set; }
        public int StageOrder { get; set; }
        public string Status { get; set; } = null!;
        public string? Description { get; set; }

        public bool MarkedForDeletion { get; set; }
        public DateTime? MarkedForDeletionDate { get; set; }
    }
}