using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.WaterBill.Master.GeographyUnit;

public class GeographyUnitQueryParameters : BaseQueryParameters
{
    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public int? Id { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public int? GeographyTypeId { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public int? ParentGeographyUnitId { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public string GeographyUnitCode { get; set; } = string.Empty;

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public string GeographyUnitName { get; set; } = string.Empty;
}
