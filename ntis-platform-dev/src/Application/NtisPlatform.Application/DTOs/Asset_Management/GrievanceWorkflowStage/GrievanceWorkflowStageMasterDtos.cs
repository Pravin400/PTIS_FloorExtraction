using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.Models;

namespace NtisPlatform.Application.DTOs.Asset_Management
{
    public class GrievanceWorkflowStageMasterDto : BaseDtos
    {
        public int UlbTypeId { get; set; }
        public string? UlbTypeName { get; set; }
        public string StageCode { get; set; } = null!;
        public string StageName { get; set; } = null!;
        public string? StageNameLocal { get; set; }
        public int StageOrder { get; set; }
        public string Status { get; set; } = null!;
        public string? Description { get; set; }
        public bool MarkedForDeletion { get; set; }
        public DateTime? MarkedForDeletionDate { get; set; }
    }

    public class CreateGrievanceWorkflowStageMasterDto : CreateBaseDtos
    {
        [Required(ErrorMessage = "GrievanceWorkflowStage_UlbTypeId_Required")]
        public int UlbTypeId { get; set; }

        [Required(ErrorMessage = "GrievanceWorkflowStage_StageCode_Required")]
        [StringLength(50, ErrorMessage = "GrievanceWorkflowStage_StageCode_MaxLen_50")]
        public string StageCode { get; set; } = null!;

        [Required(ErrorMessage = "GrievanceWorkflowStage_StageName_Required")]
        [StringLength(100, ErrorMessage = "GrievanceWorkflowStage_StageName_MaxLen_100")]
        public string StageName { get; set; } = null!;

        [StringLength(100, ErrorMessage = "GrievanceWorkflowStage_StageNameLocal_MaxLen_100")]
        public string? StageNameLocal { get; set; }

        [Required(ErrorMessage = "GrievanceWorkflowStage_StageOrder_Required")]
        public int StageOrder { get; set; }

        [Required(ErrorMessage = "GrievanceWorkflowStage_Status_Required")]
        [StringLength(50, ErrorMessage = "GrievanceWorkflowStage_Status_MaxLen_50")]
        public string Status { get; set; } = null!;

        [StringLength(500, ErrorMessage = "GrievanceWorkflowStage_Description_MaxLen_500")]
        public string? Description { get; set; }
    }

    public class UpdateGrievanceWorkflowStageMasterDto : UpdateBaseDtos
    {
        [Required(ErrorMessage = "GrievanceWorkflowStage_UlbTypeId_Required")]
        public int UlbTypeId { get; set; }

        [Required(ErrorMessage = "GrievanceWorkflowStage_StageCode_Required")]
        [StringLength(50, ErrorMessage = "GrievanceWorkflowStage_StageCode_MaxLen_50")]
        public string StageCode { get; set; } = null!;

        [Required(ErrorMessage = "GrievanceWorkflowStage_StageName_Required")]
        [StringLength(100, ErrorMessage = "GrievanceWorkflowStage_StageName_MaxLen_100")]
        public string StageName { get; set; } = null!;

        [StringLength(100, ErrorMessage = "GrievanceWorkflowStage_StageNameLocal_MaxLen_100")]
        public string? StageNameLocal { get; set; }

        [Required(ErrorMessage = "GrievanceWorkflowStage_StageOrder_Required")]
        public int StageOrder { get; set; }

        [Required(ErrorMessage = "GrievanceWorkflowStage_Status_Required")]
        [StringLength(50, ErrorMessage = "GrievanceWorkflowStage_Status_MaxLen_50")]
        public string Status { get; set; } = null!;

        [StringLength(500, ErrorMessage = "GrievanceWorkflowStage_Description_MaxLen_500")]
        public string? Description { get; set; }
    }
}
