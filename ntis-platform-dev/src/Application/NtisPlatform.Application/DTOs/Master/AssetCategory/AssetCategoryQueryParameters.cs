using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.Master;

public class AssetCategoryQueryParameters : BaseQueryParameters
{
    [Filterable] 
    [Sortable]
    [Searchable]
    public string? CategoryName { get; set; }

    [Filterable] 
    [Sortable] 
    [Searchable]
    public string? CategoryCode { get; set; }

    [Filterable]
    [Sortable]
    public bool? IsActive { get; set; }

    [Filterable]
    [Sortable]
    public bool? MarkedForDeletion { get; set; }

    [Filterable]
    [Searchable]
    [Sortable]
    public string? Description { get; set; }

    // Flag columns: typed bool? so ?HasInventory=true binds and anything else is a 400 at model binding.
    // Not [Searchable] — SearchTerm only matches string columns (FilterExpressionBuilder.BuildSearchExpression).
    [Filterable]
    [Sortable]
    public bool? HasLegalCompliance { get; set; }

    [Filterable]
    [Sortable]
    public bool? IsInventoryMandatory { get; set; }

    [Filterable]
    [Sortable]
    public bool? HasInventory { get; set; }

    [Filterable]
    [Sortable]
    public bool? HasFloorDetails { get; set; }

    [Filterable]
    [Sortable]
    public bool? IsMovable { get; set; }
}
