using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs;

public class OldWardMasterQueryParameters : BaseQueryParameters
{
    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    [RegularExpression(@"^[\u0900-\u097fa-zA-Z0-9\s\-]*$", ErrorMessage = "Special characters are not allowed in Old Ward No.")]
    public string? OldWardNo { get; set; }

    [Filterable(FilterOperator.Contains, EntityProperty = "Description")]
    [Searchable("Description")]
    [Sortable("Description")]
    [RegularExpression(@"^[\u0900-\u097fa-zA-Z0-9\s\-/,\.]*$", ErrorMessage = "Special characters are not allowed in Old Ward Name.")]
    public string? OldWardName { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    [RegularExpression(@"^[\u0900-\u097fa-zA-Z0-9\s\-/,\.]*$", ErrorMessage = "Special characters are not allowed in Description.")]
    public string? Description { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public int? OldZoneId { get; set; }
}