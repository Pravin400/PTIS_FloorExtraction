using System;
using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.ApplicationSetting;

/// <summary>
/// Query parameters for filtering, sorting and paging ApplicationSettings
/// </summary>
public class ApplicationSettingQueryParameters : BaseQueryParameters
{
    [Filterable]
    [Sortable]
    public int? Id { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? FlagName { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public string? DataType { get; set; }

    [Filterable]
    [Sortable]
    public int? ModuleId { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? Description { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? DefaultValue_NVARCHAR { get; set; }

    [Filterable]
    [Sortable]
    public bool? DefaultValue_Bit { get; set; }

    [Filterable]
    [Sortable]
    public int? DefaultValue_INT { get; set; }

    [Filterable]
    [Sortable]
    public double? DefaultValue_FLOAT { get; set; }

    [Filterable]
    [Sortable]
    public DateTime? DefaultValue_DateTime { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public bool? IsActive { get; set; }

    [Filterable]
    [Sortable]
    public int? CreatedBy { get; set; }

    [Filterable]
    [Sortable]
    public DateTime? CreatedDate { get; set; }

    [Filterable(FilterOperator.GreaterThanOrEqual, EntityProperty = nameof(CreatedDate))]
    public DateTime? CreatedDateFrom { get; set; }

    [Filterable(FilterOperator.LessThanOrEqual, EntityProperty = nameof(CreatedDate))]
    public DateTime? CreatedDateTo { get; set; }

}
