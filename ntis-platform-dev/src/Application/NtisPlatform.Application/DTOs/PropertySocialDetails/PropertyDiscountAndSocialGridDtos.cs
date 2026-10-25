using System;
using System.Collections.Generic;
using NtisPlatform.Core.Constants;

namespace NtisPlatform.Application.DTOs.PropertySocialDetails;

/// <summary>
/// Response DTO for the dedicated Discount &amp; Social Data Grid across
/// Apartment, Wing, Unit, and Property hierarchy levels.
/// </summary>
public class PropertyDiscountAndSocialGridResponseDto
{
    public DiscountSectionDataDto DiscountData { get; set; } = new();
    public DiscountSectionDataDto SocialData { get; set; } = new();
    public DiscountSocialLevelCountsDto LevelCounts { get; set; } = new();

    /// <summary>
    /// Indicates the evaluation scope for unit-level availability ("AllUnits", "SingleUnit", or "None").
    /// </summary>
    public string UnitEvaluationScope { get; set; } = PropertySocialDetailsConstants.UnitEvaluationScopes.AllUnits;
}

public class DiscountSectionDataDto
{
    public List<AppliedDiscountSocialItemDto> AppliedAttributes { get; set; } = new();
    public List<NonAppliedDiscountSocialItemDto> NonAppliedAttributes { get; set; } = new();
}

public class AppliedDiscountSocialItemDto : SocialAttributeBaseDto
{
    public int SocialAttributeId { get; set; }
    public int PropertySocialDetailId { get; set; }
    public int? SocietyDetailId { get; set; }
    public int? WingDetailId { get; set; }
    public int? PropertyId { get; set; }

    /// <summary>
    /// Hierarchy level: "Apartment", "Wing", "Unit", or "Property".
    /// </summary>
    public string Level { get; set; } = string.Empty;

    /// <summary>
    /// Entity type discriminator: "S" (Society), "W" (Wing), or "P" (Property/Unit).
    /// </summary>
    public string EntityType { get; set; } = string.Empty;

    /// <summary>
    /// Resolved wing name (e.g. "Asha", "B", "C").
    /// </summary>
    public string? WingName { get; set; }

    /// <summary>
    /// Resolved unit partition number (e.g. "1", "C1", "C2", "A1").
    /// </summary>
    public string? PartitionNo { get; set; }

    /// <summary>
    /// Resolved main property number (e.g. "116").
    /// </summary>
    public string? MainPropertyNo { get; set; }

    /// <summary>
    /// Formatted human-readable display label (e.g. "Asha Wing", "Apartment Level (116)", "C1 Unit", "Asha - 1 Unit").
    /// </summary>
    public string? DisplayLevelLabel { get; set; }

    // Values
    public bool? BitValue { get; set; }
    public int? IntValue { get; set; }
    public decimal? DecimalValue { get; set; }
    public string? TextValue { get; set; }
    public DateTime? DateValue { get; set; }

    // Media & Docs
    public int? DocumentBindingId { get; set; }
    public Guid? DocumentGuid { get; set; }
    public int? PhotoBindingId { get; set; }
    public Guid? PhotoGuid { get; set; }
    public string? Remark { get; set; }
}

public class NonAppliedDiscountSocialItemDto : SocialAttributeBaseDto
{
    public int Id { get; set; }
    public int SocialAttributeId { get; set; }
    public int? SocietyDetailId { get; set; }
    public int? WingDetailId { get; set; }
    public int? PropertyId { get; set; }

    /// <summary>
    /// Hierarchy level: "Apartment", "Wing", "Unit", or "Property".
    /// </summary>
    public string Level { get; set; } = string.Empty;

    /// <summary>
    /// Entity type discriminator: "S" (Society), "W" (Wing), or "P" (Property/Unit).
    /// </summary>
    public string EntityType { get; set; } = string.Empty;

    /// <summary>
    /// Resolved wing name (e.g. "Asha", "B", "C").
    /// </summary>
    public string? WingName { get; set; }

    /// <summary>
    /// Resolved unit partition number (e.g. "1", "C1", "C2", "A1").
    /// </summary>
    public string? PartitionNo { get; set; }

    /// <summary>
    /// Formatted human-readable display label (e.g. "Asha Wing", "Apartment Level", "C1 Unit").
    /// </summary>
    public string? DisplayLevelLabel { get; set; }
}

public class DiscountSocialLevelCountsDto
{
    public int All { get; set; }
    public int Apartment { get; set; }
    public int Wing { get; set; }
    public int Unit { get; set; }
    public int Property { get; set; }
}

/// <summary>
/// Strongly typed DTO representing a wing lookup for a property.
/// </summary>
public class PropertyWingLookupDto
{
    public int WingDetailId { get; set; }
    public string WingName { get; set; } = string.Empty;
    public int? SocietyDetailId { get; set; }
}
