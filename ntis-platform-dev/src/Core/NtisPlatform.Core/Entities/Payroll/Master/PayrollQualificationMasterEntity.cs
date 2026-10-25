using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using NtisPlatform.Core.Entities;

namespace NtisPlatform.Core.Entities.Payroll.Master;

/// <summary>
/// Entity representing Qualification Master for Municipal Payroll in schema PRMS.
/// Maps to [PRMS].[QualificationMaster] table.
/// </summary>
[Table("QualificationMaster", Schema = "PRMS")]
public class PayrollQualificationMasterEntity : BaseEntity
{
    /// <summary>
    /// Unique code for qualification (e.g., SSC, HSC, GRAD, PG)
    /// </summary>
    [Required]
    [MaxLength(30)]
    public string QualificationCode { get; set; } = string.Empty;

    /// <summary>
    /// Qualification name in English
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string QualificationName { get; set; } = string.Empty;

    /// <summary>
    /// Qualification name in Regional / Local language
    /// </summary>
    [MaxLength(150)]
    public string? QualificationNameRegional { get; set; }
}
