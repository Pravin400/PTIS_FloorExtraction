using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.WaterBill.Master.MeterTestStatusMaster;

public class MeterTestStatusMasterQueryParameters : BaseQueryParameters
{
    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public int? Id { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public string MeterTestStatus { get; set; }=string.Empty;
    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public string MeterTestStatusCode { get; set; } = string.Empty;



}
