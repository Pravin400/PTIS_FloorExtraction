using System.ComponentModel.DataAnnotations;

namespace NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceWorkflowState;

public class GrievanceWorkflowStateDto : BaseDtos
{
    public int WorkflowId { get; set; }
    public string? WorkflowName { get; set; }
    public string StateName { get; set; } = string.Empty;
    public string? StateNameLocal { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsInitial { get; set; }
    public bool IsFinal { get; set; }
}

public class CreateGrievanceWorkflowStateDto : CreateBaseDtos
{
    [Required(ErrorMessage = "WorkflowId_Required")]
    public int WorkflowId { get; set; }

    [Required(ErrorMessage = "StateName_Required")]
    [StringLength(150, ErrorMessage = "StateName_MaxLen_150")]
    public string StateName { get; set; } = string.Empty;

    [StringLength(150, ErrorMessage = "StateNameLocal_MaxLen_150")]
    public string? StateNameLocal { get; set; }

    [Range(0, 1000, ErrorMessage = "DisplayOrder_Range_0_1000")]
    public int DisplayOrder { get; set; }

    public bool IsInitial { get; set; }
    public bool IsFinal { get; set; }
}

public class UpdateGrievanceWorkflowStateDto : UpdateBaseDtos
{
    [Required(ErrorMessage = "WorkflowId_Required")]
    public int WorkflowId { get; set; }

    [Required(ErrorMessage = "StateName_Required")]
    [StringLength(150, ErrorMessage = "StateName_MaxLen_150")]
    public string StateName { get; set; } = string.Empty;

    [StringLength(150, ErrorMessage = "StateNameLocal_MaxLen_150")]
    public string? StateNameLocal { get; set; }

    [Range(0, 1000, ErrorMessage = "DisplayOrder_Range_0_1000")]
    public int DisplayOrder { get; set; }

    public bool IsInitial { get; set; }
    public bool IsFinal { get; set; }
}
