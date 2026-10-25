using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.Models;

namespace NtisPlatform.Application.DTOs.Asset_Management
{
    public class GrievanceStageAccessControlDto : BaseDtos
    {
        public int StageId { get; set; }
        public string? StageCode { get; set; }
        public string? StageName { get; set; }
        public int? DesignationId { get; set; }
        public string? DesignationName { get; set; }
        public string? DesignationCode { get; set; }
        public int? UserId { get; set; }
        public string? UserName { get; set; }
        public bool CanTakeAction { get; set; }
        public bool MarkedForDeletion { get; set; }
        public DateTime? MarkedForDeletionDate { get; set; }
    }

    public class CreateGrievanceStageAccessControlDto : CreateBaseDtos
    {
        [Required(ErrorMessage = "GrievanceStageAccess_StageId_Required")]
        [Range(1, int.MaxValue, ErrorMessage = "GrievanceStageAccess_StageId_Required")]
        public int StageId { get; set; }

        public int? DesignationId { get; set; }

        public int? UserId { get; set; }

        public bool CanTakeAction { get; set; } = true;
    }

    public class UpdateGrievanceStageAccessControlDto : UpdateBaseDtos
    {
        [Required(ErrorMessage = "GrievanceStageAccess_StageId_Required")]
        [Range(1, int.MaxValue, ErrorMessage = "GrievanceStageAccess_StageId_Required")]
        public int StageId { get; set; }

        public int? DesignationId { get; set; }

        public int? UserId { get; set; }

        public bool CanTakeAction { get; set; } = true;
    }

    public class UserStageAccessCheckResultDto
    {
        public int StageId { get; set; }
        public string StageCode { get; set; } = null!;
        public string StageName { get; set; } = null!;
        public int StageOrder { get; set; }
        public string? Status { get; set; }
        public bool HasAccess { get; set; }
        public string? Reason { get; set; }
    }
}