using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs;

public class GisFilterMasterQueryParameters : BaseQueryParameters
{
    [Filterable(FilterOperator.Equals)]
    [Searchable]
    [Sortable]
    public string? FilterKey { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? FilterLabel { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public string? ControlType { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public bool? IsActive { get; set; }
}
