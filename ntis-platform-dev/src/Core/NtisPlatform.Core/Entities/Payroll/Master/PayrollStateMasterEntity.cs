using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using NtisPlatform.Core.Entities;

namespace NtisPlatform.Core.Entities.Payroll.Master;

/// <summary>
/// Entity representing State Master for Municipal Payroll in schema PRMS.
/// Maps to [PRMS].[StateMaster] table.
/// </summary>
[Table("StateMaster", Schema = "PRMS")]
public class PayrollStateMasterEntity : BaseEntity
{
    /// <summary>
    /// Unique code for the state (e.g., MH, GJ, DL)
    /// </summary>
    [Required]
    [MaxLength(30)]
    public string StateCode { get; set; } = string.Empty;

    /// <summary>
    /// State name in English
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string StateName { get; set; } = string.Empty;

    /// <summary>
    /// State name in Regional language
    /// </summary>
    [Column("StateNameRegional")]
    [MaxLength(100)]
    public string? StateNameRegional { get; set; }
}
