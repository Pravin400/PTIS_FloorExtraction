using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.Payroll.Master.EmployeeTypeMaster;

/// <summary>
/// Query parameters for filtering, sorting, and pagination of Payroll Employee Type Master
/// </summary>
public class PayrollEmployeeTypeMasterQueryParameters : BaseQueryParameters
{
    /// <summary>Filter by employee type code</summary>
    [Filterable]
    [Sortable]
    public string? EmployeeTypeCode { get; set; }

    /// <summary>Search in employee type name (English)</summary>
    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? EmployeeTypeName { get; set; }

    /// <summary>Search in employee type name (Marathi)</summary>
    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? EmployeeTypeNameMarathi { get; set; }


    /// <summary>Filter by active status</summary>
    [Filterable]
    public bool? IsActive { get; set; }
}
