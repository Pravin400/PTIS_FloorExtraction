using System.ComponentModel.DataAnnotations;

namespace NtisPlatform.Application.DTOs.PolicyMast;

public class PolicyConditionInputDto
{
    /// <summary>Null adds a new condition; a value updates that existing condition of the policy.</summary>
    public int? Id { get; set; }
    public int SequenceNo { get; set; }
    [Required, MaxLength(10)] public string LogicalOperator { get; set; } = string.Empty;
    [Required, MaxLength(100)] public string ParameterName { get; set; } = string.Empty;
    [Required, MaxLength(50)] public string ComparisonOperator { get; set; } = string.Empty;
    [MaxLength(250)] public string? Value1 { get; set; }
    [MaxLength(250)] public string? Value2 { get; set; }
    [MaxLength(100)] public string? CompareParameterName { get; set; }
    public decimal? MultiplierValue { get; set; }
    public bool IsActive { get; set; } = true;
}

public class PolicyConditionDetailsDto
{
    public int Id { get; set; }
    public int PolicyId { get; set; }
    public int SequenceNo { get; set; }
    public string LogicalOperator { get; set; } = string.Empty;
    public string ParameterName { get; set; } = string.Empty;
    public string ComparisonOperator { get; set; } = string.Empty;
    public string? Value1 { get; set; }
    public string? Value2 { get; set; }
    public string? CompareParameterName { get; set; }
    public decimal? MultiplierValue { get; set; }
    public bool IsActive { get; set; }
    public int? CreatedBy { get; set; }
    public DateTime? CreatedDate { get; set; }
    public int? UpdatedBy { get; set; }
    public DateTime? UpdatedDate { get; set; }
}
