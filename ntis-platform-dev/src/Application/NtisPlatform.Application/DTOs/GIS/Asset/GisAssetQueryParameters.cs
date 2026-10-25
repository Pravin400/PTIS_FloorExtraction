using System.Collections.Generic;
using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.GIS.Asset;

/// <summary>
/// Consolidated query parameters for Asset GIS spatial filtering, analytics, and dynamic styling.
/// Aligned with the platform-standard query parameter architecture using BaseQueryParameters and Filterable/Sortable attributes.
/// </summary>
public class GisAssetQueryParameters : BaseQueryParameters
{
    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public int? UlbId { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public int? ZoneId { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public int? WardId { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public int? AssetCategoryId { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public int? AssetTypeId { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public int? DepartmentId { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? KpiCode { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public int? FinanceYear { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? OwnershipType { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? OccupancyStatus { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? EncroachmentStatus { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public int? AssetConditionId { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? StatusType { get; set; }

    // Dynamic Styling Overrides (Optional)
    public string? LayerCode { get; set; }
    public string? DefaultColor { get; set; }
    public Dictionary<string, string>? StatusColors { get; set; }

    // Bounding Box for GeoJSON / spatial filtering
    public double? MinLat { get; set; }
    public double? MinLng { get; set; }
    public double? MaxLat { get; set; }
    public double? MaxLng { get; set; }
}

/// <summary>
/// Backward-compatible request DTO alias ensuring 100% compatibility with all existing service contracts and controllers.
/// </summary>
public class GisAssetDataRequestDto : GisAssetQueryParameters
{
}

/// <summary>
/// Dedicated query parameters for the cascading GIS asset filters endpoint.
/// </summary>
public class GisAssetFilterQueryParameters : BaseQueryParameters
{
    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public int? ZoneId { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public int? AssetCategoryId { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public int? DepartmentId { get; set; }
}

/// <summary>
/// Dedicated query parameters for point-in-polygon spatial identification.
/// </summary>
public class GisIdentifyQueryParameters
{
    public double Lat { get; set; }
    public double Lng { get; set; }
}

/// <summary>
/// Dedicated query parameters for fetching structured asset popup attributes.
/// </summary>
public class GisAssetPopupQueryParameters
{
    [Filterable(FilterOperator.Equals)]
    public int AssetId { get; set; }
}
