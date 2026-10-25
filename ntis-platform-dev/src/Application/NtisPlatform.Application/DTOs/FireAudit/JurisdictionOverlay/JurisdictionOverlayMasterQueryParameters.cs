using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.FireAudit.JurisdictionOverlay;

public class JurisdictionOverlayMasterQueryParameters : BaseQueryParameters
{
    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public int? UlbId { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    [Searchable]
    public string? StateCode { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Sortable]
    [Searchable]
    public string? StateName { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Sortable]
    [Searchable]
    public string? IssuingAuthorityLabel { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public bool? IsActive { get; set; }
}
