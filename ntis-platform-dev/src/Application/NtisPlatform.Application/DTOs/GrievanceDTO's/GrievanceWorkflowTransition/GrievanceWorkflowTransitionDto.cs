using System.ComponentModel.DataAnnotations;

namespace NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceWorkflowTransition;

public class GrievanceWorkflowTransitionDto : BaseDtos
{
    public int WorkflowId { get; set; }
    public string? WorkflowName { get; set; }
    public int FromStateId { get; set; }
    public string? FromStateName { get; set; }
    public int ToStateId { get; set; }
    public string? ToStateName { get; set; }
    public string TransitionName { get; set; } = string.Empty;
    public bool CanForwardToDept { get; set; }
    public bool RemarkRequired { get; set; }
}

public class CreateGrievanceWorkflowTransitionDto : CreateBaseDtos
{
    [Required(ErrorMessage = "WorkflowId_Required")]
    public int WorkflowId { get; set; }

    [Required(ErrorMessage = "FromStateId_Required")]
    public int FromStateId { get; set; }

    [Required(ErrorMessage = "ToStateId_Required")]
    public int ToStateId { get; set; }

    [Required(ErrorMessage = "TransitionName_Required")]
    [StringLength(150, ErrorMessage = "TransitionName_MaxLen_150")]
    public string TransitionName { get; set; } = string.Empty;

    public bool CanForwardToDept { get; set; }
    public bool RemarkRequired { get; set; }
}

public class UpdateGrievanceWorkflowTransitionDto : UpdateBaseDtos
{
    [Required(ErrorMessage = "WorkflowId_Required")]
    public int WorkflowId { get; set; }

    [Required(ErrorMessage = "FromStateId_Required")]
    public int FromStateId { get; set; }

    [Required(ErrorMessage = "ToStateId_Required")]
    public int ToStateId { get; set; }

    [Required(ErrorMessage = "TransitionName_Required")]
    [StringLength(150, ErrorMessage = "TransitionName_MaxLen_150")]
    public string TransitionName { get; set; } = string.Empty;

    public bool CanForwardToDept { get; set; }
    public bool RemarkRequired { get; set; }
}
