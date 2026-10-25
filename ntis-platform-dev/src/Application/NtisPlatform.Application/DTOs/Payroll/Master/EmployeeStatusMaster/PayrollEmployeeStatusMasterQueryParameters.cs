using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.Payroll.Master.EmployeeStatusMaster;

/// <summary>
/// Query parameters for filtering, sorting, and pagination of Payroll Employee Status Master
/// </summary>
public class PayrollEmployeeStatusMasterQueryParameters : BaseQueryParameters
{
    /// <summary>Filter by employee status code</summary>
    [Filterable]
    [Sortable]
    public string? EmployeeStatusCode { get; set; }

    /// <summary>Search in employee status name (English)</summary>
    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? EmployeeStatus { get; set; }

    /// <summary>Search in employee status name (Marathi)</summary>
    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? EmployeeStatusMarathi { get; set; }

    /// <summary>Search in description</summary>
    [Filterable(FilterOperator.Contains)]
    [Searchable]
    public string? Description { get; set; }

    /// <summary>Filter by active status</summary>
    [Filterable]
    public bool? IsActive { get; set; }
}
