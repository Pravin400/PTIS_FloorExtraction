using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceWorkflowTransition;

public class GrievanceWorkflowTransitionQueryParameters : BaseQueryParameters
{
    [Filterable]
    [Sortable]
    public int? Id { get; set; }

    [Filterable]
    [Sortable]
    public int? WorkflowId { get; set; }

    [Filterable]
    [Sortable]
    public int? FromStateId { get; set; }

    [Filterable]
    [Sortable]
    public int? ToStateId { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? TransitionName { get; set; }

    [Filterable]
    [Sortable]
    public bool? CanForwardToDept { get; set; }

    [Filterable]
    [Sortable]
    public bool? RemarkRequired { get; set; }

    [Filterable]
    [Sortable]
    public bool? IsActive { get; set; }
}
