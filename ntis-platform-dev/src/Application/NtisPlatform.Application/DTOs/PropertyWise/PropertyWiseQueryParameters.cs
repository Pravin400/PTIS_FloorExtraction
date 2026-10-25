using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.propertywise;

public class PropertyWiseQueryParameters : BaseQueryParameters
{
    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public int? UserId { get; set; }

    [Filterable(FilterOperator.Contains, EntityProperty = "User.UserName")]
    [Searchable]
    [RegularExpression(@"^[\u0900-\u097fa-zA-Z0-9\s\-_]*$", ErrorMessage = "Special characters are not allowed in Employee Name.")]
    public string? EmployeeName { get; set; }

    [Filterable(FilterOperator.Equals)]
    public int? ModuleId { get; set; }

    [Filterable(FilterOperator.Contains, EntityProperty = "Module.ModuleName")]
    [Searchable]
    [RegularExpression(@"^[\u0900-\u097fa-zA-Z0-9\s\-_]*$", ErrorMessage = "Special characters are not allowed in Module Name.")]
    public string? ModuleName { get; set; }

    [Filterable(FilterOperator.Equals)]
    public int? ZoneId { get; set; }

    [Filterable(FilterOperator.Contains, EntityProperty = "Zone.ZoneNo")]
    [Searchable]
    [RegularExpression(@"^[\u0900-\u097fa-zA-Z0-9\s\-_]*$", ErrorMessage = "Special characters are not allowed in Zone No.")]
    public string? ZoneNo { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public int? WardId { get; set; }

    [Filterable(FilterOperator.Contains, EntityProperty = "Ward.WardNo")]
    [Searchable]
    [RegularExpression(@"^[\u0900-\u097fa-zA-Z0-9\s\-_]*$", ErrorMessage = "Special characters are not allowed in Ward No.")]
    public string? WardNo { get; set; }

    [Filterable(FilterOperator.Equals)]
    public int? DepartmentId { get; set; }

    [Filterable(FilterOperator.Contains, EntityProperty = "Department.DepartmentName")]
    [Searchable]
    [RegularExpression(@"^[\u0900-\u097fa-zA-Z0-9\s\-_]*$", ErrorMessage = "Special characters are not allowed in Department Name.")]
    public string? DepartmentName { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [RegularExpression(@"^[\u0900-\u097fa-zA-Z0-9\-_/,\.]*$", ErrorMessage = "Special characters are not allowed in From Property No.")]
    public string? FromPropertyNo { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [RegularExpression(@"^[\u0900-\u097fa-zA-Z0-9\-_/,\.]*$", ErrorMessage = "Special characters are not allowed in To Property No.")]
    public string? ToPropertyNo { get; set; }

    [Filterable(FilterOperator.Equals)]
    [Sortable]
    public bool? IsActive { get; set; }
}
