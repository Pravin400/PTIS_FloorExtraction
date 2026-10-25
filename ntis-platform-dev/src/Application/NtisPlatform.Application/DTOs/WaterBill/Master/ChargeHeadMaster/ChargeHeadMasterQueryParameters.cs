using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.WaterBill.Master.ChargeHeadMaster;

public class ChargeHeadMasterQueryParameters : BaseQueryParameters
{
    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public int? Id { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Sortable]
    public string? ChargeHeadCode { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Sortable]
    public string? ChargeHeadName { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public string? ChargeType { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public bool? IsRefundable { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public bool? IsRegularPay { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public bool? IsActive { get; set; }
}
