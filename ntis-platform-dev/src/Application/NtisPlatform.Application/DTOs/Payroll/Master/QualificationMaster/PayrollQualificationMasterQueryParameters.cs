using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.Payroll.Master.QualificationMaster;

/// <summary>
/// Query parameters for filtering, sorting, and pagination of Payroll Qualification Master
/// </summary>
public class PayrollQualificationMasterQueryParameters : BaseQueryParameters
{
    /// <summary>Filter by qualification code</summary>
    [Filterable]
    [Sortable]
    public string? QualificationCode { get; set; }

    /// <summary>Search in qualification name (English)</summary>
    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? QualificationName { get; set; }

    /// <summary>Search in qualification name (Regional)</summary>
    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? QualificationNameRegional { get; set; }

    /// <summary>Filter by active status</summary>
    [Filterable]
    public bool? IsActive { get; set; }
}
