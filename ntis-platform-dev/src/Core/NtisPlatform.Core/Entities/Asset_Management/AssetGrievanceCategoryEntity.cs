using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Core.Entities.Asset_Management
{
    /// <summary>
    /// Entity representing an asset grievance category for complaint management under AMS.
    /// Maps to [AMS].[GrievanceCategoryMaster]
    /// </summary>
    public class AssetGrievanceCategoryEntity : BaseEntity, IHardDeletable
    {
        /// <summary>
        /// Short code identifying the grievance type (varchar(50))
        /// </summary>
        public string GrievanceTypeCode { get; set; } = null!;

        /// <summary>
        /// Display name of the grievance type (nvarchar(200))
        /// </summary>
        public string GrievanceTypeName { get; set; } = null!;

        /// <summary>
        /// Display name of the grievance type in the local language (nvarchar(200))
        /// </summary>
        public string? GrievanceTypeNameLocal { get; set; }

        /// <summary>
        /// Detailed description of the grievance category (nvarchar(500))
        /// </summary>
        public string? Description { get; set; }

        /// <summary>
        /// Table whose data this grievance type corrects, when applicable (varchar(200))
        /// </summary>
        public string? TargetTableName { get; set; }


        /// <summary>
        /// Resolution SLA in days (int, nullable)
        /// </summary>
        public int? SLADays { get; set; }

        /// <summary>
        /// Format used to generate grievance numbers for this type (varchar(100))
        /// </summary>
        public string CodeFormat { get; set; } = null!;

        /// <summary>
        /// Ordering of the category in lists and dropdowns (int)
        /// </summary>
        public int DisplaySequence { get; set; }

        /// <summary>
        /// Flag indicating if entity is marked for soft/hard deletion
        /// </summary>
        public bool MarkedForDeletion { get; set; }

        /// <summary>
        /// Date when entity was marked for deletion
        /// </summary>
        public DateTime? MarkedForDeletionDate { get; set; }
    }
}
