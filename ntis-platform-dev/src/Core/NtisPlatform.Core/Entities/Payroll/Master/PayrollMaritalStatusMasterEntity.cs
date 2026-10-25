using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using NtisPlatform.Core.Entities;

namespace NtisPlatform.Core.Entities.Payroll.Master;

/// <summary>
/// Entity representing Marital Status Master for Municipal Payroll in schema PRMS.
/// Maps to [PRMS].[MaritalStatusMaster] table.
/// </summary>
[Table("MaritalStatusMaster", Schema = "PRMS")]
public class PayrollMaritalStatusMasterEntity : BaseEntity
{
    /// <summary>
    /// Unique code for the marital status (e.g., S, M, D, W)
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string MaritalStatusCode { get; set; } = string.Empty;

    /// <summary>
    /// Marital status name in English
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string MaritalStatusName { get; set; } = string.Empty;

    /// <summary>
    /// Marital status name in Regional / Local language
    /// </summary>
    [MaxLength(150)]
    public string? MaritalStatusNameRegional { get; set; }
}
