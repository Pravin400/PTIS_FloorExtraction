using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs;

public class SubFloorQueryParameters : BaseQueryParameters
{
   

    [Filterable]
    [Searchable]
    [Sortable]
    public string? SubFloorCode { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? Description { get; set; }

    [Filterable]
    [Sortable]
    public decimal? SubFloorPercentage { get; set; }

    [Filterable]
    [Sortable]
    public bool? IsActive { get; set; }

    /// <summary>
    /// Legacy sequence number. Kept for backward compatibility but not mapped in DB (PTIS.SubFloorMaster),
    /// so it cannot be sorted or filtered at the database level.
    /// </summary>
    public int? SequenceNo { get; set; }
}