using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.Asset_Management
{
    public class AssetGrievanceCategoryQueryParameters : BaseQueryParameters
    {
        [Filterable(FilterOperator.Contains)]
        [Searchable]
        [Sortable]
        public string? GrievanceTypeCode { get; set; }

        [Filterable(FilterOperator.Contains)]
        [Searchable]
        [Sortable]
        public string? GrievanceTypeName { get; set; }

        [Filterable(FilterOperator.Contains)]
        [Searchable]
        [Sortable]
        public string? GrievanceTypeNameLocal { get; set; }

        [Filterable(FilterOperator.Contains)]
        [Searchable]
        public string? Description { get; set; }

        [Filterable(FilterOperator.Contains)]
        [Sortable]
        public string? TargetTableName { get; set; }

        [Filterable]
        [Sortable]
        public int? SLADays { get; set; }

        [Filterable]
        [Sortable]
        public int? DisplaySequence { get; set; }

        [Filterable]
        [Sortable]
        public bool? IsActive { get; set; } = true;

        [Filterable]
        [Sortable]
        public bool? MarkedForDeletion { get; set; } = false;
    }
}
