using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Core.Entities.Asset_Management;

public class AssetGrievanceDocumentEntity : BaseEntity, IHardDeletable
{
    public int GrievanceDetailsId { get; set; }
    public int DocumentTypeId { get; set; }
    public int? DocumentBindingId { get; set; }
    public bool IsLatest { get; set; }
    public int? DisplayOrder { get; set; }
    public string? Remarks { get; set; }
    public bool MarkedForDeletion { get; set; }
    public DateTime? MarkedForDeletionDate { get; set; }

    public virtual AssetGrievanceDetailsEntity? GrievanceDetails { get; set; }
    public virtual AssetGrievanceDocumentTypeEntity? DocumentType { get; set; }
    public virtual DocumentBindingEntity? DocumentBinding { get; set; }
}
