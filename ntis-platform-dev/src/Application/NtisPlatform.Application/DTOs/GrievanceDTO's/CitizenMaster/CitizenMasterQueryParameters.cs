using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.GrievanceDTO_s.CitizenMaster;

public class CitizenMasterQueryParameters : BaseQueryParameters
{
    [Filterable]
    [Sortable]
    public int? Id { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? Name { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? MobileNo { get; set; }

    [Filterable]
    [Sortable]
    public bool? IsVerified { get; set; }

    [Filterable]
    [Sortable]
    public bool? IsActive { get; set; }
}
