using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceActivityLog;

public class GrievanceActivityLogQueryParameters : BaseQueryParameters
{
    [Filterable]
    [Sortable]
    public long? Id { get; set; }

    [Filterable]
    [Sortable]
    public int? GrievanceApplicationId { get; set; }

    [Filterable]
    [Sortable]
    public int? FromStateId { get; set; }

    [Filterable]
    [Sortable]
    public int? ToStateId { get; set; }

    [Filterable]
    [Sortable]
    public int? TransitionId { get; set; }

    [Filterable]
    [Sortable]
    public int? ActionByUserId { get; set; }

    [Filterable]
    [Sortable]
    public int? AssignedToUserId { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Searchable]
    public string? Remark { get; set; }
}
