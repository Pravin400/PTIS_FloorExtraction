using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Core.Entities.Payroll.Master;

/// <summary>
/// Entity representing Designation Master for Municipal Payroll in schema PRMS.
/// Maps to [PRMS].[DesignationMaster] table.
/// </summary>
[Table("DesignationMaster", Schema = "PRMS")]
public class PayrollDesignationMasterEntity : BaseEntity
{
    /// <summary>
    /// Unique code for the designation (e.g., JE, AE, CE)
    /// </summary>
    [Required]
    [MaxLength(30)]
    public string DesignationCode { get; set; } = string.Empty;

    /// <summary>
    /// Designation name in English
    /// </summary>
    [Required]
    [MaxLength(150)]
    public string DesignationName { get; set; } = string.Empty;

    /// <summary>
    /// Designation name in Marathi / Local language
    /// </summary>
    [MaxLength(150)]
    public string? DesignationNameMarathi { get; set; }

    /// <summary>
    /// Description / details of the designation
    /// </summary>
    [MaxLength(500)]
    public string? Description { get; set; }
}
