using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.Asset_Management
{
    public class GrievanceWorkflowStageQueryParameters : BaseQueryParameters
    {
        [Filterable]
        [Sortable]
        public int? UlbTypeId { get; set; }

        [Filterable(FilterOperator.Contains)]
        [Searchable]
        [Sortable]
        public string? StageCode { get; set; }

        [Filterable(FilterOperator.Contains)]
        [Searchable]
        [Sortable]
        public string? StageName { get; set; }

        [Filterable]
        [Sortable]
        public int? StageOrder { get; set; }

        [Filterable(FilterOperator.Contains)]
        [Searchable]
        [Sortable]
        public string? Status { get; set; }

        [Filterable]
        [Sortable]
        public bool? IsActive { get; set; }

        [Filterable]
        [Sortable]
        public bool? MarkedForDeletion { get; set; } = false;
    }
}
