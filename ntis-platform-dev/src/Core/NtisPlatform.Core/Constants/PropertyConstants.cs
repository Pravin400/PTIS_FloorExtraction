using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using NtisPlatform.Core.Entities;

namespace NtisPlatform.Core.Constants;

public static class PropertyConstants
{
    public static readonly IReadOnlyList<string> ApartmentCategoryNames = new[]
    {
        "Apartment",
        "Multi Commercial Apartment"
    };

    public static class Categories
    {
        public const string Apartment = "Apartment";
    }

    public static class ErrorMessages
    {
        public const string NotFound = "Property not found";
        public const string UpdateFailed = "Failed to update property details";
    }

    public static class SuccessMessages
    {
        public const string PropertyUpdated = "Property details updated successfully";
    }

    /// <summary>
    /// Expression to filter out blank/empty partitions and single-letter partitions.
    /// Only keeps partitions containing at least one digit (e.g. C1, C2, A1, B2, 1, 2, 3...)
    /// </summary>
    public static readonly Expression<Func<PropertyEntity, bool>> HasDigitInPartition =
        x => x.PartitionNo != null && x.PartitionNo != "" && (
            x.PartitionNo.Contains("0") ||
            x.PartitionNo.Contains("1") ||
            x.PartitionNo.Contains("2") ||
            x.PartitionNo.Contains("3") ||
            x.PartitionNo.Contains("4") ||
            x.PartitionNo.Contains("5") ||
            x.PartitionNo.Contains("6") ||
            x.PartitionNo.Contains("7") ||
            x.PartitionNo.Contains("8") ||
            x.PartitionNo.Contains("9")
        );

    public static class SearchByCategory
    {
        public static class ErrorMessages
        {
            public const string InvalidSearchCategory = "Invalid SearchCategory. Valid values are 1=ZoneWise, 2=WardWise, 3=BuildingWise, 4=FromToProperty.";
            public const string ZoneIdRequired = "ZoneId is required for Zone Wise search.";
            public const string WardIdRequired = "WardId is required for this search category.";
            public const string PropertyNoRequired = "PropertyNo is required for Building Wise search.";
            public const string PropertyFromRequired = "PropertyFrom is required for Property Range search.";
            public const string InvalidPropertyFromFormat = "PropertyFrom must start with a numeric property number (e.g. '1' or '1-A9').";
            public const string InvalidPropertyToFormat = "PropertyTo must start with a numeric property number (e.g. '1-S2').";
            public const string InvalidPropertyAssessmentStatusIdFormat = "PropertyAssessmentStatusId must be a comma-separated list of integers (e.g. '1,2').";
        }
    }

    /// <summary>
    /// Maximum rows allowed for building structure generation in one request.
    /// </summary>
    public const int MaxGeneratedRows = 5000;

    /// <summary>
    /// Constants for PTIS.FLatGenerationGroupMaster groups.
    /// </summary>
    public static class FlatGenerationGroups
    {
        public const string Upper = "UPPER";
        public const string Ground = "GROUND";
        public const string General = "GENERAL";
        public const string OpenPlot = "OPENPLOT";
        public const string Podium = "PODIUM";
    }

    /// <summary>
    /// Supported generation types for building structure generation.
    /// </summary>
    public static class GenerationTypes
    {
        public const string Horizontal = "H";
        public const string Vertical = "V";
        public const string HorizontalCustom = "HC";
        public const string VerticalCustom = "VC";
    }
}

/// <summary>
/// Flat generation group constants matching PTIS.FLatGenerationGroupMaster.
/// </summary>
public static class FlatGenerationGroupConstants
{
    public const string Upper = PropertyConstants.FlatGenerationGroups.Upper;
    public const string Ground = PropertyConstants.FlatGenerationGroups.Ground;
    public const string General = PropertyConstants.FlatGenerationGroups.General;
    public const string OpenPlot = PropertyConstants.FlatGenerationGroups.OpenPlot;
    public const string Podium = PropertyConstants.FlatGenerationGroups.Podium;
}
public static class PartTypeConstants
{
    /// <summary>
    /// Name of the property part type used in PropertyTypeMaster
    /// </summary>
    public const string Amenity = "Amenity";
    public const string Residential = "R";
    public const string Commercial = "C";
    public const string Plot = "Plot";
}
public static class PartitionNoConstants
{
    /// <summary>
    /// Name of the property part type used in PropertyTypeMaster
    /// </summary>
    public const string AmenityPartitionNo = "AM";
}

public static class VirtualPropertyConstants
{
    /// <summary>
    /// Prefix used for virtual property numbers.
    /// </summary>
    public const string VirtualPropertyPrefix = "VP";
}

/// <summary>
/// Constants and error keys utilized during property and partition split workflows.
/// </summary>
public static class PropertySplitConstants
{
    /// <summary>
    /// Category key for mapping table denoting property split operations.
    /// </summary>
    public const string MappingCategorySplit = "SPLIT";

    /// <summary>
    /// Default active status code.
    /// </summary>
    public const string StatusActive = "ACTIVE";

    /// <summary>
    /// Default Marathi owner name used when historical record lacks owner details.
    /// </summary>
    public const string DefaultOwnerName = "धारक";

    /// <summary>
    /// Default English owner name used when historical record lacks owner details.
    /// </summary>
    public const string DefaultOwnerNameEnglish = "The Holder";

    /// <summary>
    /// Audit remark logged when split properties are generated.
    /// </summary>
    public const string SplitRemark = "Main Property has been split into Sub-Properties.";

    /// <summary>
    /// Fallback Property Map Master ID used when no matching active master record is found.
    /// </summary>
    public const int DefaultPropertyMapMasterId = 2;

    /// <summary>
    /// Maximum allowed length for alphabetic suffix string (prevents runaway loop / overflow).
    /// </summary>
    public const int MaxSuffixLength = 3;

    /// <summary>
    /// Standard error messages and localization keys for property split operations.
    /// </summary>
    public static class ErrorMessages
    {
        /// <summary>
        /// Error indicating that the property number was not provided.
        /// </summary>
        public const string PropertyNoRequired = "PROPERTY_NO_REQUIRED";

        /// <summary>
        /// Error indicating that the partition number was not provided for a partition split.
        /// </summary>
        public const string PartitionNoRequired = "PARTITION_NO_REQUIRED";

        /// <summary>
        /// Error indicating that the number of splits requested is zero or negative.
        /// </summary>
        public const string NoOfSplitsGreaterThanZero = "NO_OF_SPLITS_GREATER_THAN_ZERO";

        /// <summary>
        /// Error indicating that the user ID is zero or negative.
        /// </summary>
        public const string UserIdGreaterThanZero = "USER_ID_GREATER_THAN_ZERO";

        /// <summary>
        /// Error indicating that the ward ID is zero or negative.
        /// </summary>
        public const string WardIdGreaterThanZero = "WARD_ID_GREATER_THAN_ZERO";

        /// <summary>
        /// Error indicating that the module ID is zero or negative.
        /// </summary>
        public const string ModuleIdGreaterThanZero = "MODULE_ID_GREATER_THAN_ZERO";

        /// <summary>
        /// Error indicating that the workflow stage ID is zero or negative.
        /// </summary>
        public const string WorkflowStageIdGreaterThanZero = "WORKFLOW_STAGE_ID_GREATER_THAN_ZERO";

        /// <summary>
        /// Error indicating that the user does not exist or is inactive.
        /// </summary>
        public const string UserNotExistOrInactive = "USER_NOT_EXIST_OR_INACTIVE";

        /// <summary>
        /// Error indicating that the specified ward is not allocated to the user.
        /// </summary>
        public const string WardNotAllocatedToUser = "WARD_NOT_ALLOCATED_TO_USER";

        /// <summary>
        /// Error indicating that the base property does not exist or is inactive.
        /// </summary>
        public const string BasePropertyNotExistOrInactive = "BASE_PROPERTY_NOT_EXIST_OR_INACTIVE";

        /// <summary>
        /// Error indicating that the maximum allowable split suffix limit has been exceeded.
        /// </summary>
        public const string MaxSplitLimitReached = "MAX_SPLIT_LIMIT_REACHED";
    }
}