using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.Master.SocietyWingDetails;

public class WingPropertyDetailsQueryParameters : BaseQueryParameters
{
    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public int? WingDetailId { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? PropertyNo { get; set; }

    [Filterable(FilterOperator.Equals)]
    public int? WardId { get; set; }

    public string? FromPartitionNo { get; set; }

    public string? ToPartitionNo { get; set; }

    [Filterable(FilterOperator.Equals)]
    public bool? IsActive { get; set; }

    /// <summary>
    /// Filter flag: "All" (default, active properties regardless of mapping status),
    /// "New" (properties not present in PropertyMapDetail),
    /// "Old" (properties present in PropertyMapDetail).
    /// </summary>
    public string? Flag { get; set; } = "All";
}
