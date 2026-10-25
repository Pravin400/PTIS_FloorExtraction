using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Core.Entities.Asset_Management;

public class AssetGrievanceDocumentTypeEntity : BaseEntity, IHardDeletable
{
    public int GrievanceCategoryId { get; set; }
    public string DocumentTypeCode { get; set; } = null!;
    public string DocumentTypeName { get; set; } = null!;
    public string? Description { get; set; }
    public bool IsRequired { get; set; }
    public int? DisplayOrder { get; set; }
    public bool MarkedForDeletion { get; set; }
    public DateTime? MarkedForDeletionDate { get; set; }

    public virtual AssetGrievanceCategoryEntity? AssetGrievanceCategory { get; set; }
}
