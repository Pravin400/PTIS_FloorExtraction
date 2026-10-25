using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;

namespace NtisPlatform.Application.DTOs.GrievanceDTO_s.PublicDashboard;

public class PublicDashboardQueryParameters : BaseQueryParameters
{
    [Filterable]
    [Sortable]
    public int? DepartmentId { get; set; }

    [Filterable]
    [Sortable]
    public int? CitizenId { get; set; }

    [Filterable]
    [Sortable]
    public int? ZoneId { get; set; }

    [Filterable]
    [Sortable]
    public int? WardId { get; set; }

    [Filterable]
    [Sortable]
    public DateTime? FromDate { get; set; }

    [Filterable]
    [Sortable]
    public DateTime? ToDate { get; set; }
}
