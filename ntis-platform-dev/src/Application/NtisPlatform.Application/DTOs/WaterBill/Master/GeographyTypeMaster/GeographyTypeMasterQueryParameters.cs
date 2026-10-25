using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.WaterBill.Master.GeographyTypeMaster;

public class GeographyTypeMasterQueryParameters : BaseQueryParameters
{
    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public int? Id { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public string GeographyType { get; set; } = string.Empty;

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public string GeographyTypeCode { get; set; } = string.Empty;

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public int? LevelNo { get; set; }
}
