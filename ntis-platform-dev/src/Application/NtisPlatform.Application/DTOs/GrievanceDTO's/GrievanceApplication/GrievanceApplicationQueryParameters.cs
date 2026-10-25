using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceApplication;

public class GrievanceApplicationQueryParameters : BaseQueryParameters
{
    [Filterable]
    [Sortable]
    public int? Id { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? GrievanceNo { get; set; }

    [Filterable]
    [Sortable]
    public int? CitizenId { get; set; }

    [Filterable]
    [Sortable]
    public int? GrievanceDepartmentId { get; set; }

    [Filterable]
    [Sortable]
    public int? WardId { get; set; }

    [Filterable]
    [Sortable]
    public int? ZoneId { get; set; }

    [Filterable]
    [Sortable]
    public int? GrievanceTypeId { get; set; }

    [Filterable]
    [Sortable]
    public int? WorkflowId { get; set; }

    [Filterable]
    [Sortable]
    public int? CurrentStateId { get; set; }

    [Filterable]
    [Sortable]
    public int? CurrentAssignedToUserId { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Searchable]
    public string? RoadLandmark { get; set; }

    [Filterable]
    public string? Latitude { get; set; }

    [Filterable]
    public string? Longitude { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Searchable]
    public string? Description { get; set; }

    [Filterable]
    [Sortable]
    public bool? IsActive { get; set; }
}
