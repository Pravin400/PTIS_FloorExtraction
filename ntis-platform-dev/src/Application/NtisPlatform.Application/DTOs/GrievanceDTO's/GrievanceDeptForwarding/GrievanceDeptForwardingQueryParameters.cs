using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceDeptForwarding;

public class GrievanceDeptForwardingQueryParameters : BaseQueryParameters
{
    [Filterable]
    [Sortable]
    public int? Id { get; set; }

    [Filterable]
    [Sortable]
    public int? GrievanceApplicationId { get; set; }

    [Filterable]
    [Sortable]
    public long? ActivityLogId { get; set; }

    [Filterable]
    [Sortable]
    public int? ForwardedToDeptId { get; set; }

    [Filterable]
    [Sortable]
    public int? AssignedToUserId { get; set; }

    [Filterable]
    [Sortable]
    public string? ForwardingStatus { get; set; }

    [Filterable]
    [Sortable]
    public bool? IsActive { get; set; }
}
