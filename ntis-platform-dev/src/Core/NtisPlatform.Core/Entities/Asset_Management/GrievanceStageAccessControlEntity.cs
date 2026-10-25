using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Core.Entities.Asset_Management
{
    /// <summary>
    /// Entity controlling access permissions to a grievance workflow stage.
    /// Supports designation-wise access or specific user overrides.
    /// Maps to [AMS].[StageAccessControl]
    /// </summary>
    public class GrievanceStageAccessControlEntity : BaseEntity, IHardDeletable
    {
        public int StageId { get; set; }
        public int? DesignationId { get; set; }
        public int? UserId { get; set; }
        public bool CanTakeAction { get; set; } = true;

        public bool MarkedForDeletion { get; set; }
        public DateTime? MarkedForDeletionDate { get; set; }

        public GrievanceWorkflowStageMasterEntity? Stage { get; set; }
        public UserEntity? User { get; set; }
    }
}