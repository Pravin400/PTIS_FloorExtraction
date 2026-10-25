using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceWorkflowState;

public class GrievanceWorkflowStateQueryParameters : BaseQueryParameters
{
    [Filterable]
    [Sortable]
    public int? Id { get; set; }

    [Filterable]
    [Sortable]
    public int? WorkflowId { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? StateName { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? StateNameLocal { get; set; }

    [Filterable]
    [Sortable]
    public bool? IsInitial { get; set; }

    [Filterable]
    [Sortable]
    public bool? IsFinal { get; set; }

    [Filterable]
    [Sortable]
    public bool? IsActive { get; set; }
}
