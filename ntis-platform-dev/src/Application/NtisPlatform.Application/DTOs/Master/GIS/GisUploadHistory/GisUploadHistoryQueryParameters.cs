using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs;

public class GisUploadHistoryQueryParameters : BaseQueryParameters
{
    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? FileName { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public string? Status { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public int? UploadedBy { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public bool? IsActive { get; set; }
}
