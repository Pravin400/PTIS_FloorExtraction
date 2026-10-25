using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs;

public class GisDepartmentUserAccessQueryParameters : BaseQueryParameters
{
    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public int? UserId { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public int? DepartmentId { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public int? UlbId { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public int? ZoneId { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public bool? IsActive { get; set; }
}
