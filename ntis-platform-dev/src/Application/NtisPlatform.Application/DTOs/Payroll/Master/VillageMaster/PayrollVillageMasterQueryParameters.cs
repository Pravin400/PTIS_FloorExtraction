using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.Payroll.Master.VillageMaster;

/// <summary>
/// Query parameters for filtering, sorting, and pagination of Payroll Village Master
/// </summary>
public class PayrollVillageMasterQueryParameters : BaseQueryParameters
{
    /// <summary>Filter by taluka ID</summary>
    [Filterable]
    [Sortable]
    public int? TalukaId { get; set; }

    /// <summary>Search in village code</summary>
    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? VillageCode { get; set; }

    /// <summary>Search in village name (English)</summary>
    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? VillageName { get; set; }

    /// <summary>Search in village name (Regional)</summary>
    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? VillageNameRegional { get; set; }

    /// <summary>Search in PIN code</summary>
    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? PINCode { get; set; }

    /// <summary>Filter by active status</summary>
    [Filterable]
    public bool? IsActive { get; set; }
}
