using System.ComponentModel.DataAnnotations;

namespace NtisPlatform.Application.DTOs.PolicyMast;

public class PolicyMastDto : BaseDtos
{
    public string? PolicyCode { get; set; }
    public string? PolicyName { get; set; }
    public string? Description { get; set; }
    public int? CreatedBy { get; set; }
    public int? UpdatedBy { get; set; }
    public bool MarkedForDeletion { get; set; }
    public DateTime? MarkedForDeletionDate { get; set; }
    public List<PolicyConditionDetailsDto> PolicyConditionDetails { get; set; } = new();
}

public class CreatePolicyMastDto : CreateBaseDtos
{
    public List<PolicyConditionInputDto>? PolicyConditionDetails { get; set; }

    [MaxLength(50, ErrorMessage = "PolicyMast_PolicyCode_MaxLen_50")]
    public string? PolicyCode { get; set; }

    [MaxLength(150, ErrorMessage = "PolicyMast_PolicyName_MaxLen_150")]
    public string? PolicyName { get; set; }

    [MaxLength(500, ErrorMessage = "PolicyMast_Description_MaxLen_500")]
    public string? Description { get; set; }
}

public class UpdatePolicyMastDto : UpdateBaseDtos
{
    /// <summary>Null leaves conditions untouched; otherwise the list is the full set (omitted ones are deactivated).</summary>
    public List<PolicyConditionInputDto>? PolicyConditionDetails { get; set; }

    [MaxLength(50, ErrorMessage = "PolicyMast_PolicyCode_MaxLen_50")]
    public string? PolicyCode { get; set; }

    [MaxLength(150, ErrorMessage = "PolicyMast_PolicyName_MaxLen_150")]
    public string? PolicyName { get; set; }

    [MaxLength(500, ErrorMessage = "PolicyMast_Description_MaxLen_500")]
    public string? Description { get; set; }
}
