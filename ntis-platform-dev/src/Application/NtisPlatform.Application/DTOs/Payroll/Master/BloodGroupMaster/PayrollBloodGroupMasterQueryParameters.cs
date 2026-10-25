using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.Payroll.Master.BloodGroupMaster;

/// <summary>
/// Query parameters for filtering, sorting, and pagination of Payroll Blood Group Master
/// </summary>
public class PayrollBloodGroupMasterQueryParameters : BaseQueryParameters
{
    /// <summary>Search in blood group code</summary>
    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? BloodGroupCode { get; set; }

    /// <summary>Search in blood group name</summary>
    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? BloodGroupName { get; set; }

    /// <summary>Filter by active status</summary>
    [Filterable]
    public bool? IsActive { get; set; }
}
