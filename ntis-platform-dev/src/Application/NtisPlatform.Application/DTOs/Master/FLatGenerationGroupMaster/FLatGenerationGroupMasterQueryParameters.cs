using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.DTOs.Queries;

namespace NtisPlatform.Application.DTOs;

/// <summary>
/// Query parameters for filtering, sorting, and searching Flat Generation Group Master
/// </summary>
public class FLatGenerationGroupMasterQueryParameters : BaseQueryParameters
{
    [Filterable(FilterOperator.Contains)]
    [Sortable]
    [Searchable]
    public string? FLatGenerationGroup { get; set; }

    [Filterable]
    [Sortable]
    public bool? IsActive { get; set; }
}
