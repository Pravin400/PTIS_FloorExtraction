using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.Payroll.Master.MaritalStatusMaster;

/// <summary>
/// Query parameters for filtering, sorting, and pagination of Payroll Marital Status Master
/// </summary>
public class PayrollMaritalStatusMasterQueryParameters : BaseQueryParameters
{
    /// <summary>Filter by marital status code</summary>
    [Filterable]
    [Sortable]
    public string? MaritalStatusCode { get; set; }

    /// <summary>Search in marital status name (English)</summary>
    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? MaritalStatusName { get; set; }

    /// <summary>Search in marital status name (Regional)</summary>
    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? MaritalStatusNameRegional { get; set; }

    /// <summary>Filter by active status</summary>
    [Filterable]
    public bool? IsActive { get; set; }
}
