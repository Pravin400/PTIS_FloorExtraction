using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.DTOs;

namespace NtisPlatform.Application.DTOs.PropertyBulkUpdate;

/// <summary>
/// Payload for PUT /api/UpdateIdWise.
/// Updates owner, occupier, contact, assessment, and photo details
/// across multiple properties in a single request.
/// Only non-null fields are applied — null fields are skipped.
/// </summary>
public class UpdatePropertyIdWiseDetailsDto : UpdateBaseDtos
{
    /// <summary>
    /// List of PropertyMast IDs to update. Required and must contain at least one ID.
    /// </summary>
    [Required(ErrorMessage = "PropertyIds_Required")]
    [MinLength(1, ErrorMessage = "PropertyIds_MinLength_1")]
    public IList<int> PropertyIds { get; set; } = new List<int>();

    // ===== Owner Information =====

    [StringLength(100, ErrorMessage = "OwnerTitle_MaxLen_100")]
    public string? OwnerTitle { get; set; }

    [StringLength(1000, ErrorMessage = "OwnerName_MaxLen_1000")]
    public string? OwnerName { get; set; }

    [StringLength(100, ErrorMessage = "OwnerTitleEnglish_MaxLen_100")]
    public string? OwnerTitleEnglish { get; set; }

    [StringLength(1000, ErrorMessage = "OwnerNameEnglish_MaxLen_1000")]
    public string? OwnerNameEnglish { get; set; }

    // ===== Occupier Information =====

    [StringLength(100, ErrorMessage = "OccupierTitle_MaxLen_100")]
    public string? OccupierTitle { get; set; }

    [StringLength(1000, ErrorMessage = "OccupierName_MaxLen_1000")]
    public string? OccupierName { get; set; }

    [StringLength(100, ErrorMessage = "OccupierTitleEnglish_MaxLen_100")]
    public string? OccupierTitleEnglish { get; set; }

    [StringLength(1000, ErrorMessage = "OccupierNameEnglish_MaxLen_1000")]
    public string? OccupierNameEnglish { get; set; }

    // ===== Contact Information =====

    [StringLength(13, ErrorMessage = "MobileNo_MaxLen_13")]
    [RegularExpression(@"^[0-9+\-\s()]*$", ErrorMessage = "MobileNo_InvalidFormat")]
    public string? MobileNo { get; set; }

    // ===== Assessment Details =====

    [Range(1, int.MaxValue, ErrorMessage = "OwnerTypeId_Positive")]
    public int? OwnerTypeId { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "NoOfResidentialToilets_NonNegative")]
    public int? NoOfResidentialToilets { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "NoOfCommercialToilets_NonNegative")]
    public int? NoOfCommercialToilets { get; set; }

    // ===== Photo Details =====

    /// <summary>
    /// FK to PropertyPhotoType — the photo slot/category (e.g. Front Elevation).
    /// Required only when DocumentBindingId is also provided.
    /// </summary>
    [Range(1, int.MaxValue, ErrorMessage = "PhotoTypeId_Positive")]
    public int? PhotoTypeId { get; set; }

    /// <summary>
    /// FK to DocumentBinding — links to the uploaded image document.
    /// Required only when PhotoTypeId is also provided.
    /// </summary>
    [Range(1, int.MaxValue, ErrorMessage = "DocumentBindingId_Positive")]
    public int? DocumentBindingId { get; set; }

    /// <summary>
    /// Returns true if any owner/occupier/contact field is provided.
    /// </summary>
    public bool HasOwnerFields() => OwnerTitle != null || OwnerName != null || OwnerTitleEnglish != null ||
        OwnerNameEnglish != null || OccupierTitle != null || OccupierName != null || OccupierTitleEnglish != null ||
        OccupierNameEnglish != null || MobileNo != null;

    /// <summary>
    /// Returns true if any assessment field is provided.
    /// </summary>
    public bool HasAssessmentFields() => OwnerTypeId.HasValue || NoOfResidentialToilets.HasValue || NoOfCommercialToilets.HasValue;

    /// <summary>
    /// Returns true if photo fields are provided (both PhotoTypeId and DocumentBindingId required together).
    /// </summary>
    public bool HasPhotoFields() => PhotoTypeId.HasValue && DocumentBindingId.HasValue;

    /// <summary>
    /// Checks if at least one updatable field has been provided in the payload.
    /// </summary>
    public bool HasAnyField() => HasOwnerFields() || HasAssessmentFields() || HasPhotoFields() || PhotoTypeId.HasValue || DocumentBindingId.HasValue;
}
