using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.Payroll.Master.TalukaMaster;

/// <summary>
/// Query parameters for filtering, sorting, and pagination of Payroll Taluka Master
/// </summary>
public class PayrollTalukaMasterQueryParameters : BaseQueryParameters
{
    /// <summary>Filter by district ID</summary>
    [Filterable]
    [Sortable]
    public int? DistrictId { get; set; }

    /// <summary>Search in taluka code</summary>
    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? TalukaCode { get; set; }

    /// <summary>Search in taluka name (English)</summary>
    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? TalukaName { get; set; }

    /// <summary>Search in taluka name (Regional)</summary>
    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? TalukaNameRegional { get; set; }

    /// <summary>Filter by city classification</summary>
    [Filterable]
    public bool? IsCity { get; set; }

    /// <summary>Filter by active status</summary>
    [Filterable]
    public bool? IsActive { get; set; }
}
