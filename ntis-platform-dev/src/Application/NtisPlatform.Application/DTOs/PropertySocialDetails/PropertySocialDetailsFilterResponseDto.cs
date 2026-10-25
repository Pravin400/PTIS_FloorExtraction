using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace NtisPlatform.Application.DTOs.PropertySocialDetails;

/// <summary>
/// Base class containing all common master attribute fields from SocialAttributeMaster.
/// Inherited by Applied, Non-Applied, and Hierarchy attribute DTOs to avoid code redundancy.
/// </summary>
public class SocialAttributeBaseDto
{
    public string SocialAttributeCode { get; set; } = string.Empty;
    public string SocialAttributeName { get; set; } = string.Empty;

    public string AttributeName
    {
        get => SocialAttributeName;
        set => SocialAttributeName = value;
    }

    public string DataType { get; set; } = string.Empty;
    public string? Unit { get; set; }
    public int? DisplayOrder { get; set; }
    public int? ParentAttributeId { get; set; }
    public bool IsRequiredWhenParentTrue { get; set; }
    public bool IsDiscountApplicable { get; set; }
    public int? PhotoTypeId { get; set; }
    public string? AttributeCategory { get; set; }
    public bool IsPhotoRequired { get; set; }
    public bool IsDocumentRequired { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsCommonAreaAttribute { get; set; }
}

/// <summary>
/// Page-load response for Property Social Details screen, separating attributes
/// into applied and non-applied lists based on the provided filter parameters.
/// </summary>
public class PropertySocialDetailsFilterResponseDto
{
    /// <summary>
    /// Attributes that are already applied for the specified filter criteria.
    /// Appears first in the response.
    /// </summary>
    public List<AppliedSocialAttributeDto> AppliedAttributes { get; set; } = new();

    /// <summary>
    /// Available attributes that are not yet applied for the specified filter criteria.
    /// Appears second in the response.
    /// </summary>
    public List<NonAppliedSocialAttributeDto> NonAppliedAttributes { get; set; } = new();
}

/// <summary>
/// Represents an attribute that is already applied to a property, wing, or society.
/// Inherits all attribute master fields and encapsulates applied social-detail values.
/// </summary>
public class AppliedSocialAttributeDto : SocialAttributeBaseDto
{
    public int SocialAttributeId { get; set; }

    public int AttributeMasterId
    {
        get => SocialAttributeId;
        set => SocialAttributeId = value;
    }

    public int PropertySocialDetailId { get; set; }
    public int? SocietyDetailId { get; set; }
    public int? WingDetailId { get; set; }
    public int? PropertyId { get; set; }

    public bool? BitValue { get; set; }
    public int? IntValue { get; set; }
    public decimal? DecimalValue { get; set; }
    public string? TextValue { get; set; }
    public DateTime? DateValue { get; set; }

    public int? DocumentBindingId { get; set; }
    public Guid? DocumentGuid { get; set; }

    public int? PhotoBindingId { get; set; }
    public Guid? PhotoGuid { get; set; }

    public string? Remark { get; set; }
}

/// <summary>
/// Represents an available attribute from SocialAttributeMaster that has not yet been applied
/// for the specified filter criteria. Pure master data and flags with no PropertySocialDetails values.
/// </summary>
public class NonAppliedSocialAttributeDto : SocialAttributeBaseDto
{
    public int Id { get; set; }

    public int SocialAttributeId
    {
        get => Id;
        set => Id = value;
    }

    public int AttributeMasterId
    {
        get => Id;
        set => Id = value;
    }
}
