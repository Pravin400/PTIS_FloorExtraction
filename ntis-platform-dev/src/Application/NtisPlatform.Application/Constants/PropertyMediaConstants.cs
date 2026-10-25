using NtisPlatform.Core.Constants;

namespace NtisPlatform.Application.Constants;

/// <summary>
/// Domain constants for Property Media, Photo Coverage, and Gap Analysis.
/// </summary>
public static class PropertyMediaConstants
{
    // Photo Scopes
    public const string ScopeProperty = "PROPERTY";
    public const string ScopeWing = "WING";
    public const string ScopeSociety = "SOCIETY";
    public const string ScopeAmenity = "AMENITY";

    // Property Category Constants
    public const int SocietyCategoryId = 1;
    public const int IndividualCategoryId = 2;
    public const string IndividualCategoryKeyword = "Individual";

    // Partition Number Conditions
    public const string PartitionZero = "0";
    public const string PartitionDash = "-";
    public const string PartitionEmpty = "";

    // Social Facility Photo Type & Attribute Codes
    public const string PhotoTypeCodeStp = "STP";
    public const string SocialCodeStp = "HAS_STP";
    public const string PhotoTypeCodeEcs = "ECS";
    public const string SocialCodeEcs = "HAS_EV_CHARGING";
    public const string PhotoTypeCodeLft = "LFT";
    public const string SocialCodeLft = "HAS_LIFT";
    public const string PhotoTypeCodeSwc = "SWC";
    public const string SocialCodeSwc = "HAS_GARBAGE_DISPOSAL";

    // Amenity Text Literals
    public const string AmenityPartType = PartTypeConstants.Amenity;
    public const string AmenityMarathi = "अॅमिनीटी";
    public const string AmenityMarathiAlternate = "अ\u200Dॅमिनीटी";

    // Mandatory Photo Type Names
    public const string PhotoTypeNameFront = "Property Front Photo";
    public const string PhotoTypeNameSide = "Property Side Photo";
    public const string PhotoTypeNameInside = "Property Inside Photo";
    public const string PhotoTypeNameBoard = "Property Board Photo";
    public const string PhotoTypeNamePlan = "Property Plan";

    public static readonly HashSet<string> MandatoryPhotoTypeNames =
        new(StringComparer.OrdinalIgnoreCase)
        {
            PhotoTypeNameFront,
            PhotoTypeNameSide,
            PhotoTypeNameInside,
            PhotoTypeNameBoard,
            PhotoTypeNamePlan
        };

    // Water Related Photo Type Codes
    public static readonly HashSet<string> WaterRelatedPhotoTypeCodes =
        new(StringComparer.OrdinalIgnoreCase)
        {
            "WATER_CONNECTION",
            "LWB",
            "WPR",
            "CSL",
            "CWO",
            "MIC",
            "NDC",
            "APD",
            "CPP"
        };

    // Cached array for EF Core LINQ query translation
    public static readonly string[] WaterRelatedPhotoTypeCodeArray =
        WaterRelatedPhotoTypeCodes.ToArray();

    // File Match Resolver Constants
    public const int MaxSegmentLength = 10;
}
