using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceWorkflow;

public class GrievanceWorkflowQueryParameters : BaseQueryParameters
{
    [Filterable]
    [Sortable]
    public int? Id { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? WorkflowName { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? WorkflowNameLocal { get; set; }

    [Filterable]
    [Sortable]
    public bool? IsDefault { get; set; }

    [Filterable]
    [Sortable]
    public bool? IsActive { get; set; }
}
