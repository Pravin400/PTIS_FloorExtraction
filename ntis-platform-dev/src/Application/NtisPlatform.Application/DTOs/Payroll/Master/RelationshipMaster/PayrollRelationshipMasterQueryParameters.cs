using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.Payroll.Master.RelationshipMaster;

/// <summary>
/// Query parameters for filtering, sorting, and pagination of Payroll Relationship Master
/// </summary>
public class PayrollRelationshipMasterQueryParameters : BaseQueryParameters
{
    /// <summary>Filter by relationship code</summary>
    [Filterable]
    [Sortable]
    public string? RelationshipCode { get; set; }

    /// <summary>Search in relationship name (English)</summary>
    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? RelationshipName { get; set; }

    /// <summary>Search in relationship name (Regional)</summary>
    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? RelationshipNameRegional { get; set; }

    /// <summary>Filter by active status</summary>
    [Filterable]
    public bool? IsActive { get; set; }
}
