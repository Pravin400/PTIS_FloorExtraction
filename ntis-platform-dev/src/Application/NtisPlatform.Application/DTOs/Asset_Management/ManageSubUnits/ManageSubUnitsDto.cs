using NtisPlatform.Application.DTOs.Asset_Management.AssetLeaseRentDetails;

namespace NtisPlatform.Application.DTOs.Asset_Management.ManageSubUnits;

/// <summary>
/// Display names resolved by joining a sub-unit's FK ids against their master tables
/// (AssetCategoryMaster/AssetTypeMaster/AssetTypeOfUseMaster/AssetSubTypeOfUseMaster/Zone/Ward/
/// Mouja). Not backed by columns on AssetMaster itself.
/// </summary>
public class SubUnitNamesDto
{
    public string Category { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string? UseType { get; set; }
    public string? SubUseType { get; set; }
    public string? Zone { get; set; }
    public string? Ward { get; set; }
    public string? Mouja { get; set; }
}

/// <summary>
/// DTO for Get All sub-units listing.
/// API: GET /api/ManageSubUnits/by-asset/{assetId}
/// </summary>
public class SubUnitListDto
{
    public int Id { get; set; }

    public string AssetNo { get; set; } = string.Empty;
    public string AssetName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Occupancy { get; set; } = string.Empty;

    public decimal? BuiltUpAreaSqMeter { get; set; }
    public decimal? CarpetAreaSqMeter { get; set; }
    public decimal? CapitalValue { get; set; }
    public DateTime? LastCVDate { get; set; }
    /// <summary>Age of the sub-unit in years: current year minus the construction year parsed from floor details.</summary>
    public int? AssetLife { get; set; }

    public SubUnitNamesDto Names { get; set; } = new();
}

// Note: the eye-button details endpoint (GET /api/ManageSubUnits/{assetId}) now returns the
// rich SubAssetDetailDto (DTOs/Asset_Management/AssetMaster/AssetMasterDto.cs) so that a single
// sub-unit is described with the same shape as one element of the grouped
// GetSubAssetsGroupedByParentAsync payload.

/// <summary>
/// One sub-unit (child asset) under a parent asset.
/// Returned by GET /api/ManageSubUnits/parent/{parentAssetId}/complete-details and
/// GET /api/ManageSubUnits/parent/{parentAssetId}/all-details. Only all-details fills the
/// identifier, unit type, aggregate, demand and lease summary fields; they stay null otherwise.
/// </summary>
public class SubUnitCompleteDetailDto
{
    public int Id { get; set; }
    public string AssetNo { get; set; } = string.Empty;
    public string AssetName { get; set; } = string.Empty;
    public int? ParentAssetId { get; set; }
    public string? OccupancyStatus { get; set; }
    public bool IsActive { get; set; }
    public int? DepartmentId { get; set; }

    // Location identifiers (AMS.AssetDetails). PropertyNo falls back to the parent's.
    public string? PropertyNo { get; set; }
    public string? UnitNo { get; set; }
    public string? PartitionNo { get; set; }
    public string? MpmsNo { get; set; }
    public string? PTaxId { get; set; }
    public string? UpicId { get; set; }

    /// <summary>Flat / Shop / Office / Room / Open Space / Amenity, derived from AssetNo or AssetName.</summary>
    public string? UnitType { get; set; }

    // Totals over FloorDetails; null when the sub-unit has no floor rows.
    public decimal? CapitalValue { get; set; }
    public decimal? BuiltUpAreaSqMeter { get; set; }
    public decimal? CarpetAreaSqMeter { get; set; }

    // Lease summary from the primary (first) LeaseRentDetails row; null when there is no lease.
    public decimal? AnnualRevenue { get; set; }
    public decimal? RentAmount { get; set; }
    public decimal? MonthlyRent { get; set; }

    // AMS.MonthWiseDemand totals; null when the sub-unit has no demand rows.
    public decimal? TotalDemand { get; set; }
    public decimal? TotalCollection { get; set; }
    public decimal? TotalArrears { get; set; }
    /// <summary>Collection / demand as a whole-number percentage (half-to-even rounding).</summary>
    public decimal? CollectionEfficiency { get; set; }

    /// <summary>Average over floors of CVFloorFactor × CVAgeFactor × CVNatureFactor × CVUseFactor (null factors count as 1).</summary>
    public decimal? AvgWeightedValue { get; set; }

    public string? TenantName { get; set; }
    public DateTime? LeaseStartDate { get; set; }
    public DateTime? LeaseEndDate { get; set; }
    /// <summary>True when at least one lease matched; otherwise null (never false).</summary>
    public bool? IsRented { get; set; }

    public List<SubUnitFloorDetailDto> FloorDetails { get; set; } = new();
    public List<SubUnitRoomWiseDetailDto> RoomWiseDetails { get; set; } = new();
    public List<AssetLeaseRentDetailsDto> LeaseRentDetails { get; set; } = new();
}

public class SubUnitFloorDetailDto
{
    public int Id { get; set; }
    public int AssetId { get; set; }
    public int FloorId { get; set; }
    public int? SubFloorId { get; set; }
    public string? ConstructionYear { get; set; }
    public string? AssessmentYear { get; set; }
    public int ConstructionTypeId { get; set; }
    public int TypeOfUseId { get; set; }
    public int? SubTypeOfUseId { get; set; }
    public decimal? CarpetAreaSqMeter { get; set; }
    public decimal? CarpetAreaSqFeet { get; set; }
    public decimal? BuiltupAreaSqMeter { get; set; }
    public decimal? BuiltupAreaSqFeet { get; set; }
    public int? NoOfRooms { get; set; }
    public decimal? BaseValue { get; set; }
    public decimal? CapitalValue { get; set; }
    public decimal? CVAgeFactor { get; set; }
    public decimal? CVFloorFactor { get; set; }
    public decimal? CVNatureFactor { get; set; }
    public decimal? CVUseFactor { get; set; }
    public decimal? CVBaseRate { get; set; }
    public bool? IsRented { get; set; }
    public bool IsActive { get; set; }
    
    public string? FloorName { get; set; }
    public string? SubFloorName { get; set; }
    public string? ConstructionTypeName { get; set; }
    public string? TypeOfUseName { get; set; }
    public string? SubTypeOfUseName { get; set; }
}

public class SubUnitRoomWiseDetailDto
{
    public int Id { get; set; }
    public int? AssetId { get; set; }
    public int? FloorDetailsId { get; set; }
    public string? RoomNo { get; set; }
    public string? RoomType { get; set; }
    public string? Shape { get; set; }
    public double? LengthMtr { get; set; }
    public double? WidthMtr { get; set; }
    public double? HeightMtr { get; set; }
    public double? AreaSqMtr { get; set; }
    public double? TotalAreaSqMtr { get; set; }
    public bool OuterYesNo { get; set; }
    public bool MinusYesNo { get; set; }
    public bool IsActive { get; set; }

    public List<SubUnitRoomWiseMinusDetailDto> MinusDetails { get; set; } = new();
}

public class SubUnitRoomWiseMinusDetailDto
{
    public int Id { get; set; }
    public int? RoomWiseSubmissionId { get; set; }
    public string? Shape { get; set; }
    public double? LengthMtr { get; set; }
    public double? WidthMtr { get; set; }
    public double? HeightMtr { get; set; }
    public double? AreaSqMtr { get; set; }
    public bool IsActive { get; set; }
}

/// <summary>
/// Combined detail payload for a single sub-unit and its lease/rent record.
/// Used by the ManageSubUnits eye-button details endpoint when the caller has
/// a SubUnitsDetails id.
/// </summary>
public class SubUnitLeaseRentDetailDto
{
    public int SubUnitDetailsId { get; set; }
    public int AssetId { get; set; }
    public string AssetNo { get; set; } = string.Empty;
    public string AssetName { get; set; } = string.Empty;
    public int? ParentAssetId { get; set; }

    public SubUnitFloorDetailDto? FloorDetails { get; set; }
    public AssetLeaseRentDetailsDto? LeaseRentDetails { get; set; }

    /// <summary>
    /// Photos from AMS.AssetPhoto where Remarks is 'Asset Image' or 'Asset Photo Plan',
    /// linked to this sub-unit via SubUnitDetailsId.
    /// </summary>
    public List<SubUnitPhotoDto> Photos { get; set; } = new();
}

/// <summary>
/// Slim photo reference returned inside <see cref="SubUnitLeaseRentDetailDto"/>.
/// Carries only the fields needed to display or download the photo.
/// </summary>
public class SubUnitPhotoDto
{
    public int PhotoId { get; set; }
    public string PhotoTypeCode { get; set; } = string.Empty;
    public string PhotoTypeName { get; set; } = string.Empty;
    /// <summary>Remarks value — 'Asset Image' or 'Asset Photo Plan'.</summary>
    public string? Remarks { get; set; }
    public Guid? DocumentGuid { get; set; }
    public string? FileName { get; set; }
    public string? MimeType { get; set; }
    public int? DisplayOrder { get; set; }
}
