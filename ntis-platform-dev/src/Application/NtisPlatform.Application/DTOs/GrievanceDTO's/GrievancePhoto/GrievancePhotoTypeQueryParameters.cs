using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievancePhotoType;

public class GrievancePhotoTypeQueryParameters : BaseQueryParameters
{
    [Filterable]
    [Sortable]
    public int? Id { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? PhotoTypeCode { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? PhotoTypeName { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? Description { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? PhotoScope { get; set; }

    [Filterable]
    [Sortable]
    public bool? IsActive { get; set; }
}
