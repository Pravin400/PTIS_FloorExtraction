using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceEscalation;

public class GrievanceEscalationQueryParameters : BaseQueryParameters
{
    [Filterable]
    [Sortable]
    public int? Id { get; set; }

    [Filterable]
    [Sortable]
    public int? GrievanceApplicationId { get; set; }

    [Filterable]
    [Sortable]
    public int? WardId { get; set; }

    [Filterable]
    [Sortable]
    public int? ZoneId { get; set; }

    [Filterable]
    [Sortable]
    public int? EscalatedByUserId { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public string? Priority { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public string? EscalationStatus { get; set; }

    [Filterable]
    [Sortable]
    public int? TargetDepartmentId { get; set; }

    [Filterable]
    [Sortable]
    public int? TargetAssignedToUserId { get; set; }

    [Filterable]
    [Sortable]
    public int? RespondedByUserId { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Searchable]
    public string? Reason { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Searchable]
    public string? StaffResponse { get; set; }

    [Filterable]
    [Sortable]
    public bool? IsActive { get; set; } = true;
}
