using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.DTOs.Queries;

namespace NtisPlatform.Application.DTOs.Asset_Management.AssetLeaseRentDetails;

/// <summary>
/// AssetCategoryId/AssetTypeId/ParentAssetId/AssetNo target columns one hop away on
/// AssetMasterEntity; ZoneId/WardId are two hops away via AssetMasterEntity.Details
/// (AssetDetailsEntity). FilterExpressionBuilder only resolves a single direct
/// Type.GetProperty(name) call with no support for dotted/nested paths, so these must NOT carry
/// [Filterable]/[Searchable] — AssetLeaseRentDetailsService.GetAllAsync applies them through its
/// explicit asset join instead.
/// No RentStatus/PaymentStatus: AssetLeaseRentDetailsEntity has no column for either and no
/// agreed semantics, so they were accepted and silently ignored — removed rather than advertised
/// as filters that do nothing.
/// </summary>
public class AssetLeaseRentDetailsQueryParameters : BaseQueryParameters
{
    public int? AssetCategoryId { get; set; }

    public int? ZoneId { get; set; }

    public int? AssetTypeId { get; set; }

    public int? WardId { get; set; }

    public int? ParentAssetId { get; set; }

    [Filterable]
    public int? AssetId { get; set; }

    [Filterable]
    public string? WorkflowStatus { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? TenantName { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? TenantMobile { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? ShopName { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? ShopNo { get; set; }

    public string? AssetNo { get; set; }

    [Filterable(FilterOperator.GreaterThanOrEqual, EntityProperty = "LeaseStartDate")]
    public DateTime? FromDate { get; set; }

    [Filterable(FilterOperator.LessThanOrEqual, EntityProperty = "LeaseEndDate")]
    public DateTime? ToDate { get; set; }

    [Filterable]
    public bool? IsActive { get; set; }
}
