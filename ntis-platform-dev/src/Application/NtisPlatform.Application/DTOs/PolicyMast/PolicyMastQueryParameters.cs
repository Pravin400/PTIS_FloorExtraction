using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;

namespace NtisPlatform.Application.DTOs.PolicyMast;

public class PolicyMastQueryParameters : BaseQueryParameters
{
    [Filterable]
    [Sortable]
    public string? PolicyCode { get; set; }

    [Filterable]
    [Sortable]
    public string? PolicyName { get; set; }

    [Filterable]
    [Sortable]
    public string? Description { get; set; }

    [Filterable]
    public bool? IsActive { get; set; }

    [Filterable]
    public bool? MarkedForDeletion { get; set; }
}
