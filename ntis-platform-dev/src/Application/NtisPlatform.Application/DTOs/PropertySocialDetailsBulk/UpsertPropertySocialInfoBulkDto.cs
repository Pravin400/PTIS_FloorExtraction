using System.ComponentModel.DataAnnotations;
using NtisPlatform.Core.Constants;

namespace NtisPlatform.Application.DTOs.PropertySocialDetailsBulk;

public class UpsertPropertySocialInfoBulkDto
{
    [Range(1, int.MaxValue, ErrorMessage = "PropertySocialDetails_PropertyId_Range")]
    public int? PropertyId { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "PropertySocialDetails_PropertyId_Range")]
    public int? SocietyDetailId { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "PropertySocialDetails_PropertyId_Range")]
    public int? WingDetailId { get; set; }

    [Required(ErrorMessage = "UpdatedBy_Required")]
    [Range(1, int.MaxValue, ErrorMessage = "UpdatedBy_Range")]
    public int UpdatedBy { get; set; }

    [Required]
    public string EntityType { get; set; } = PropertySocialDetailsConstants.EntityTypes.Property;

    public List<PropertySocialInfoItemsDto> SocialAttributes { get; set; } = new();

    public List<int> SocialAttributeIdsToRemove { get; set; } = new();

    public List<int> PropertySocialDetailIdsToRemove { get; set; } = new();
}

public class PropertySocialInfoItemsDto
{
    public int? Id { get; set; }

    [Required(ErrorMessage = "PropertySocialDetails_SocialAttributeId_Required")]
    [Range(1, int.MaxValue, ErrorMessage = "PropertySocialDetails_SocialAttributeId_Range")]
    public int SocialAttributeId { get; set; }

    public bool? BitValue { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "PropertySocialDetails_IntValue_Range")]
    public int? IntValue { get; set; }

    [Range(0.0, double.MaxValue, ErrorMessage = "PropertySocialDetails_DecimalValue_Range")]
    public decimal? DecimalValue { get; set; }

    [MaxLength(500, ErrorMessage = "PropertySocialDetails_TextValue_MaxLen_500")]
    [RegularExpression(PropertySocialDetailsConstants.TextValidationRegex, ErrorMessage = "PropertySocialDetails_TextValue_InvalidCharacters")]
    public string? TextValue { get; set; }
    public DateTime? DateValue { get; set; }

    //public int? DocumentBindingId { get; set; }

    [MaxLength(500, ErrorMessage = "PropertySocialDetails_Remark_MaxLen_500")]
    [RegularExpression(PropertySocialDetailsConstants.TextValidationRegex, ErrorMessage = "PropertySocialDetails_Remark_InvalidCharacters")]
    public string? Remark { get; set; }
}
