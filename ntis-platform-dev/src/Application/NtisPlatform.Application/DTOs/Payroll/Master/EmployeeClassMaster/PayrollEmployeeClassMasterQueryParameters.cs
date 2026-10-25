using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.Payroll.Master.EmployeeClassMaster;

/// <summary>
/// Query parameters for filtering, sorting, and pagination of Payroll Employee Class Master
/// </summary>
public class PayrollEmployeeClassMasterQueryParameters : BaseQueryParameters
{
    /// <summary>Filter by class code</summary>
    [Filterable]
    [Sortable]
    public string? ClassCode { get; set; }

    /// <summary>Search in class name (English)</summary>
    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? ClassName { get; set; }

    /// <summary>Search in class name (Marathi)</summary>
    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? ClassNameMarathi { get; set; }

    /// <summary>Search in description</summary>
    [Filterable(FilterOperator.Contains)]
    [Searchable]
    public string? Description { get; set; }

    /// <summary>Filter by active status</summary>
    [Filterable]
    public bool? IsActive { get; set; }
}
