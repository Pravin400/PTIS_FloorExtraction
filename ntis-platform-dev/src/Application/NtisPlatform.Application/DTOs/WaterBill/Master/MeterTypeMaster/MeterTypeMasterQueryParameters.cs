using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.WaterBill.Master.MeterTypeMaster;

public class MeterTypeMasterQueryParameters : BaseQueryParameters
{
    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public int? Id { get; set; }
    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public string MeterTypeCode { get; set; } = string.Empty;

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public string MeterType { get; set; } = string.Empty;
    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public string? Description { get; set; }
}
