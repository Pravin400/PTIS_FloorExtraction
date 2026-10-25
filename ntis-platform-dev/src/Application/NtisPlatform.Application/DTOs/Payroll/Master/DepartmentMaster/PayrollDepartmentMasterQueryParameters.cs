using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.Payroll.Master.DepartmentMaster;

/// <summary>
/// Query parameters for filtering, sorting, and pagination of Payroll Department Master
/// </summary>
public class PayrollDepartmentMasterQueryParameters : BaseQueryParameters
{
    /// <summary>
    /// Filter by department code
    /// </summary>
    [Filterable]
    [Sortable]
    public string? DepartmentCode { get; set; }

    /// <summary>
    /// Search in department name (English)
    /// </summary>
    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? DepartmentName { get; set; }

    /// <summary>
    /// Search in department name (Marathi)
    /// </summary>
    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? DepartmentNameMarathi { get; set; }



    /// <summary>
    /// Filter by active status
    /// </summary>
    [Filterable]
    public bool? IsActive { get; set; }
}
