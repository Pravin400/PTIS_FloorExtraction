using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.WaterBill.Master.ReadingSourceMaster;

public class ReadingSourceMasterQueryParameters : BaseQueryParameters
{
    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public int? Id { get; set; }
    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public string ReadingSourceCode { get; set; } = string.Empty;
    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public string ReadingSource { get; set; } = string.Empty;
}
