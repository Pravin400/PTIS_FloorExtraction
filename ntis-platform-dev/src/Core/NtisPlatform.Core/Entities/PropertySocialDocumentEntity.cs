using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Core.Entities;

/// <summary>
/// Represents the junction entity linking PropertySocialDetails with DocumentBinding (PTIS.PropertySocialDocument).
/// Supports soft/hard deletion lifecycle via IHardDeletable.
/// </summary>
public class PropertySocialDocumentEntity : BaseEntity, IHardDeletable
{
    public int PropertySocialDetailsId { get; set; }
    public int? DocumentBindingId { get; set; }

    // IHardDeletable Implementation
    public bool MarkedForDeletion { get; set; } = false;
    public DateTime? MarkedForDeletionDate { get; set; }
    
    // Navigation Properties
    public virtual PropertySocialDetailsEntity? PropertySocialDetails { get; set; }
    public virtual DocumentBindingEntity? DocumentBinding { get; set; }
}
