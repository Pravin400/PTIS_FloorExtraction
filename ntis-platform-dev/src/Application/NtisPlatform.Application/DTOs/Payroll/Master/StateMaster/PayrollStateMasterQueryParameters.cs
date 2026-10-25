using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.Payroll.Master.StateMaster;

/// <summary>
/// Query parameters for filtering, sorting, and pagination of Payroll State Master
/// </summary>
public class PayrollStateMasterQueryParameters : BaseQueryParameters
{
    /// <summary>Search in state code</summary>
    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? StateCode { get; set; }

    /// <summary>Search in state name (English)</summary>
    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? StateName { get; set; }

    /// <summary>Search in state name (Regional)</summary>
    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? StateNameRegional { get; set; }

    /// <summary>Filter by active status</summary>
    [Filterable]
    public bool? IsActive { get; set; }
}
