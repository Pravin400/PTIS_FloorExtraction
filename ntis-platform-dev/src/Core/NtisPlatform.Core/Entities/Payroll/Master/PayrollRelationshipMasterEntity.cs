using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using NtisPlatform.Core.Entities;

namespace NtisPlatform.Core.Entities.Payroll.Master;

/// <summary>
/// Entity representing Relationship Master for Municipal Payroll in schema PRMS.
/// Maps to [PRMS].[RelationshipMaster] table.
/// </summary>
[Table("RelationshipMaster", Schema = "PRMS")]
public class PayrollRelationshipMasterEntity : BaseEntity
{
    /// <summary>
    /// Unique code for relationship (e.g., SPOUSE, SON, DAUGHTER, FATHER, MOTHER)
    /// </summary>
    [Required]
    [MaxLength(30)]
    public string RelationshipCode { get; set; } = string.Empty;

    /// <summary>
    /// Relationship name in English
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string RelationshipName { get; set; } = string.Empty;

    /// <summary>
    /// Relationship name in Regional / Local language
    /// </summary>
    [MaxLength(150)]
    public string? RelationshipNameRegional { get; set; }
}
