using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.Payroll.Master.DistrictMaster;

/// <summary>
/// Query parameters for filtering, sorting, and pagination of Payroll District Master
/// </summary>
public class PayrollDistrictMasterQueryParameters : BaseQueryParameters
{
    /// <summary>Filter by state ID</summary>
    [Filterable]
    [Sortable]
    public int? StateId { get; set; }

    /// <summary>Search in district code</summary>
    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? DistrictCode { get; set; }

    /// <summary>Search in district name (English)</summary>
    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? DistrictName { get; set; }

    /// <summary>Search in district name (Regional)</summary>
    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? DistrictNameRegional { get; set; }

    /// <summary>Filter by active status</summary>
    [Filterable]
    public bool? IsActive { get; set; }
}
