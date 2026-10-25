using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.Payroll.Master.ZoneDivisionMaster;

/// <summary>
/// Query parameters for filtering, sorting, and pagination of Payroll Zone Division Master
/// </summary>
public class PayrollZoneDivisionMasterQueryParameters : BaseQueryParameters
{
    /// <summary>Search in zone/division code</summary>
    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? ZoneDivisionCode { get; set; }

    /// <summary>Search in zone/division name (English)</summary>
    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? ZoneDivisionName { get; set; }

    /// <summary>Search in zone/division name (Regional)</summary>
    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? ZoneDivisionNameRegional { get; set; }

    /// <summary>Filter by active status</summary>
    [Filterable]
    public bool? IsActive { get; set; }
}
