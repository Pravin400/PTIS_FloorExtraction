using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;

namespace NtisPlatform.Application.DTOs.Asset_Management
{
    public class GrievanceStageAccessControlQueryParameters : BaseQueryParameters
    {
        [Filterable]
        [Sortable]
        public int? StageId { get; set; }

        [Filterable]
        [Sortable]
        public int? DesignationId { get; set; }

        [Filterable]
        [Sortable]
        public int? UserId { get; set; }

        [Filterable]
        [Sortable]
        public bool? CanTakeAction { get; set; }

        [Filterable]
        [Sortable]
        public bool? IsActive { get; set; } = true;

        [Filterable]
        [Sortable]
        public bool? MarkedForDeletion { get; set; } = false;
    }
}