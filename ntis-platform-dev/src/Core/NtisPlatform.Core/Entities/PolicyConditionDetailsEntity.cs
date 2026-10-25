using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NtisPlatform.Core.Entities;

/// <summary>
/// Represents one policy condition. Maps to [PTIS].[PolicyConditionDetails] table.
/// </summary>
[Table("PolicyConditionDetails", Schema = "PTIS")]
public class PolicyConditionDetailsEntity : BaseEntity
{
    public int PolicyId { get; set; }

    public int SequenceNo { get; set; }

    [Column(TypeName = "varchar(10)")]
    [StringLength(10)]
    public string LogicalOperator { get; set; } = string.Empty;

    [Column(TypeName = "varchar(100)")]
    [StringLength(100)]
    public string ParameterName { get; set; } = string.Empty;

    [Column(TypeName = "varchar(50)")]
    [StringLength(50)]
    public string ComparisonOperator { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(250)")]
    [StringLength(250)]
    public string? Value1 { get; set; }

    [Column(TypeName = "nvarchar(250)")]
    [StringLength(250)]
    public string? Value2 { get; set; }

    [Column(TypeName = "varchar(100)")]
    [StringLength(100)]
    public string? CompareParameterName { get; set; }

    [Column(TypeName = "decimal(18,6)")]
    public decimal? MultiplierValue { get; set; }

    public PolicyMastEntity? Policy { get; set; }
}
