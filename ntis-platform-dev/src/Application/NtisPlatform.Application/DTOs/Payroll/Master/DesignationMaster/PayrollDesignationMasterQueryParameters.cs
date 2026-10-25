using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.Payroll.Master.DesignationMaster;

/// <summary>
/// Query parameters for filtering, sorting, and pagination of Payroll Designation Master
/// </summary>
public class PayrollDesignationMasterQueryParameters : BaseQueryParameters
{
    /// <summary>
    /// Filter by designation code
    /// </summary>
    [Filterable]
    [Sortable]
    public string? DesignationCode { get; set; }

    /// <summary>
    /// Search in designation name (English)
    /// </summary>
    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? DesignationName { get; set; }

    /// <summary>
    /// Search in designation name (Marathi)
    /// </summary>
    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? DesignationNameMarathi { get; set; }



    /// <summary>
    /// Filter by active status
    /// </summary>
    [Filterable]
    public bool? IsActive { get; set; }
}
