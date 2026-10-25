using NtisPlatform.Application.DTOs.Asset_Management.AssetDocument;
using NtisPlatform.Application.DTOs.Asset_Management.ManageSubUnits;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Models;

namespace NtisPlatform.Application.DTOs.Asset_Management.AssetMaster;

/// <summary>
/// Paging, search and sort for a parent asset's sub-unit details. <c>SearchTerm</c> matches the
/// unit number, name, regional name or the tenant of the unit's lease in force today. <c>SortBy</c> accepts
/// AssetNo (default), AssetName or CreatedDate.
/// </summary>
public class SubUnitDetailsQueryParameters : BaseQueryParameters
{
    /// <summary>When true, only active sub-units (the rows the Sub Unit Details grid lists).</summary>
    public bool ActiveOnly { get; set; }
}

/// <summary>
/// One page of a parent asset's sub-units with their floor (AMS.SubUnitsDetails) rows and uploaded
/// photo/document files. Inventory items are not sub-units and are never included.
/// <see cref="PagedResult{T}.TotalCount"/> is the number of sub-units matching the search (the pager's total).
/// </summary>
public class ParentSubUnitDetailsResponseDto : PagedResult<SubUnitWithFilesDto>
{
    public int ParentAssetId { get; set; }
    public string ParentAssetNo { get; set; } = string.Empty;
    public string ParentAssetName { get; set; } = string.Empty;
    public bool ParentIsActive { get; set; }

    /// <summary>All sub-units of the parent in scope (ActiveOnly applied), before the search.</summary>
    public int TotalSubUnits { get; set; }
}

/// <summary>One sub-unit (non-inventory child asset) with its floor rows and uploaded files.</summary>
public class SubUnitWithFilesDto
{
    public int AssetId { get; set; }
    public string AssetNo { get; set; } = string.Empty;
    public string AssetName { get; set; } = string.Empty;
    public string? AssetRegionalName { get; set; }
    public int AssetCategoryId { get; set; }
    public string? AssetCategoryName { get; set; }
    public int AssetTypeId { get; set; }
    public string? AssetTypeName { get; set; }
    public string? OccupancyStatus { get; set; }

    /// <summary>False for units that were bulk-generated but not yet configured.</summary>
    public bool IsActive { get; set; }

    public DateTime? CreatedDate { get; set; }

    /// <summary>Active floor / sub-floor rows (AMS.SubUnitsDetails) of this sub-unit.</summary>
    public List<SubUnitFloorDetailDto> FloorDetails { get; set; } = new();

    /// <summary>
    /// Latest photos that have an uploaded file. <see cref="AssetPhotoFileDto.SubUnitsDetailsId"/>
    /// links a photo to one of <see cref="FloorDetails"/>.
    /// </summary>
    public List<AssetPhotoFileDto> Photos { get; set; } = new();

    /// <summary>Latest documents that have an uploaded file.</summary>
    public List<AssetDocumentDto> Documents { get; set; } = new();
}
