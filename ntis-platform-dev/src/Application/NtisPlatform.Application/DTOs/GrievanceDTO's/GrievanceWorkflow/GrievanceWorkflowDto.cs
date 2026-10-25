using System.ComponentModel.DataAnnotations;

namespace NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceWorkflow;

public class GrievanceWorkflowDto : BaseDtos
{
    public string WorkflowName { get; set; } = string.Empty;
    public string? WorkflowNameLocal { get; set; }
    public string? Description { get; set; }
    public bool IsDefault { get; set; }
    public int StatesCount { get; set; }
    public int TransitionsCount { get; set; }
}

public class CreateGrievanceWorkflowDto : CreateBaseDtos
{
    [Required(ErrorMessage = "WorkflowName_Required")]
    [StringLength(200, ErrorMessage = "WorkflowName_MaxLen_200")]
    public string WorkflowName { get; set; } = string.Empty;

    [StringLength(200, ErrorMessage = "WorkflowNameLocal_MaxLen_200")]
    public string? WorkflowNameLocal { get; set; }

    [StringLength(500, ErrorMessage = "Description_MaxLen_500")]
    public string? Description { get; set; }

    public bool IsDefault { get; set; }
}

public class UpdateGrievanceWorkflowDto : UpdateBaseDtos
{
    [Required(ErrorMessage = "WorkflowName_Required")]
    [StringLength(200, ErrorMessage = "WorkflowName_MaxLen_200")]
    public string WorkflowName { get; set; } = string.Empty;

    [StringLength(200, ErrorMessage = "WorkflowNameLocal_MaxLen_200")]
    public string? WorkflowNameLocal { get; set; }

    [StringLength(500, ErrorMessage = "Description_MaxLen_500")]
    public string? Description { get; set; }

    public bool IsDefault { get; set; }
}
