using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using NtisPlatform.Core.Entities;

namespace NtisPlatform.Core.Entities.Payroll.Master;

/// <summary>
/// Entity representing Gender Master for Municipal Payroll in schema PRMS.
/// Maps to [PRMS].[GenderMaster] table.
/// </summary>
[Table("GenderMaster", Schema = "PRMS")]
public class PayrollGenderMasterEntity : BaseEntity
{
    /// <summary>
    /// Unique code for the gender (e.g., M, F, O)
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string GenderCode { get; set; } = string.Empty;

    /// <summary>
    /// Gender name in English
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string GenderName { get; set; } = string.Empty;

    /// <summary>
    /// Gender name in Regional / Local language
    /// </summary>
    [MaxLength(100)]
    public string? GenderNameRegional { get; set; }
}
