using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.Payroll.Master.GenderMaster;

/// <summary>
/// Query parameters for filtering, sorting, and pagination of Payroll Gender Master
/// </summary>
public class PayrollGenderMasterQueryParameters : BaseQueryParameters
{
    /// <summary>Filter by gender code</summary>
    [Filterable]
    [Sortable]
    public string? GenderCode { get; set; }

    /// <summary>Search in gender name (English)</summary>
    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? GenderName { get; set; }

    /// <summary>Search in gender name (Regional)</summary>
    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? GenderNameRegional { get; set; }

    /// <summary>Filter by active status</summary>
    [Filterable]
    public bool? IsActive { get; set; }
}
