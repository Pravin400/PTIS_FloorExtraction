using NtisPlatform.Application.DTOs.Asset_Management.AssetDocument;
using NtisPlatform.Application.Models;

namespace NtisPlatform.Application.DTOs.Asset_Management.AssetMaster;

/// <summary>
/// Paged main-asset (ParentAssetId = null) list for the Asset Register grid. <see cref="Summary"/>
/// is computed over the whole filtered set, not just the current page.
/// </summary>
public class ParentAssetListResponseDto : PagedResult<ParentAssetListItemDto>
{
    public ParentAssetListSummaryDto Summary { get; set; } = new();

    public ParentAssetListResponseDto()
    {
    }

    public ParentAssetListResponseDto(IEnumerable<ParentAssetListItemDto> items, int totalCount, int pageNumber, int pageSize)
        : base(items, totalCount, pageNumber, pageSize)
    {
    }
}

/// <summary>Totals over every main asset matching the filters (summary cards).</summary>
public class ParentAssetListSummaryDto
{
    public int TotalParentAssets { get; set; }
    public int ActiveParentAssets { get; set; }

    /// <summary>Sub-units (non-inventory child assets) under the filtered main assets, active or not.</summary>
    public int TotalSubUnits { get; set; }

    /// <summary>The active subset of <see cref="TotalSubUnits"/>.</summary>
    public int ActiveSubUnits { get; set; }

    public decimal TotalCapitalValue { get; set; }

    /// <summary>Annualised rent of leases in force today on the main assets and their sub-units.</summary>
    public decimal TotalAnnualRevenue { get; set; }

    /// <summary>Pending amount of uncancelled rent demand (AMS.MonthWiseDemand).</summary>
    public decimal TotalOutstanding { get; set; }

    /// <summary>Main assets whose EncroachmentStatus is set to anything other than a "no issue" value.</summary>
    public int EncroachedAssets { get; set; }
}

/// <summary>One main asset row of the Asset Register grid, with its sub-unit roll-ups.</summary>
public class ParentAssetListItemDto
{
    // Asset
    public int Id { get; set; }
    public string AssetNo { get; set; } = string.Empty;
    public string AssetName { get; set; } = string.Empty;
    public string? AssetRegionalName { get; set; }
    public bool IsActive { get; set; }
    public DateTime? CreatedDate { get; set; }
    public DateTime? UpdatedDate { get; set; }
    public int AssetCategoryId { get; set; }
    public string? AssetCategoryName { get; set; }
    public int AssetTypeId { get; set; }
    public string? AssetTypeName { get; set; }
    public string? MpmsNo { get; set; }
    public string? Address { get; set; }
    public string? ZoneName { get; set; }
    public string? WardName { get; set; }

    /// <summary>Photo column: DocumentId of the latest "Asset Image" photo.</summary>
    public int? AssetDocumentId { get; set; }

    // Basic details
    public string? CSN { get; set; }

    /// <summary>Oldest construction year across the asset's own and its sub-units' floor rows.</summary>
    public int? ConstructionYear { get; set; }

    /// <summary>Most common construction type across those floor rows.</summary>
    public string? ConstructionTypeName { get; set; }

    // Ownership
    public string? OwnershipType { get; set; }
    public int? DepartmentId { get; set; }

    /// <summary>Custodian (owning department).</summary>
    public string? DepartmentName { get; set; }

    // Use details
    public string? OccupancyStatus { get; set; }

    /// <summary>
    /// Every sub-unit of this asset: non-deleted child assets that are not inventory items,
    /// including bulk-generated units that stay inactive until they are configured.
    /// </summary>
    public int TotalSubUnits { get; set; }

    /// <summary>
    /// Active sub-units — the rows the Sub Unit Details grid (GET api/ManageSubUnits/by-asset/{id}) lists.
    /// </summary>
    public int ActiveSubUnits { get; set; }

    /// <summary>Most common type of use across the floor rows.</summary>
    public string? TypeOfUseName { get; set; }

    // Area
    public decimal? PlotAreaSqMeter { get; set; }
    public decimal? CarpetAreaSqMeter { get; set; }
    public decimal? BuiltUpAreaSqMeter { get; set; }

    /// <summary>Distinct floors across the floor rows (UI renders G+N from this).</summary>
    public int TotalFloors { get; set; }

    // Maintenance
    public int? AssetConditionId { get; set; }
    public string? AssetCondition { get; set; }

    // Rent details
    public int ActiveLeaseCount { get; set; }

    // Encroachment
    public string? EncroachmentStatus { get; set; }

    // Valuation
    public decimal CapitalValue { get; set; }
    public decimal AnnualRevenue { get; set; }
    public decimal OutstandingAmount { get; set; }

    // Documents

    /// <summary>
    /// Latest photo records, including enabled photo types with no file uploaded yet
    /// (same count as GetById's Photos).
    /// </summary>
    public int PhotoCount { get; set; }

    /// <summary>Latest document records, including enabled document types with no file uploaded yet.</summary>
    public int DocumentCount { get; set; }

    public bool HasPlanDocument { get; set; }
    public bool HasTitleDocument { get; set; }
    public bool HasSurveyDocument { get; set; }

    /// <summary>Latest photos of this asset that have an uploaded file, each with its DocumentGuid.</summary>
    public List<AssetPhotoFileDto> Photos { get; set; } = new();

    /// <summary>Latest documents of this asset that have an uploaded file, each with its DocumentGuid.</summary>
    public List<AssetDocumentDto> Documents { get; set; } = new();
}
