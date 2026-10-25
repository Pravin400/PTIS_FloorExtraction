using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Core.Entities.Payroll.Master;

/// <summary>
/// Entity representing Employee Type Master for Municipal Payroll in schema PRMS.
/// Maps to [PRMS].[EmployeeTypeMaster] table.
/// </summary>
[Table("EmployeeTypeMaster", Schema = "PRMS")]
public class PayrollEmployeeTypeMasterEntity : BaseEntity
{
    /// <summary>
    /// Unique code for employee type (e.g., PERM, CONT, PROB)
    /// </summary>
    [Required]
    [MaxLength(30)]
    public string EmployeeTypeCode { get; set; } = string.Empty;

    /// <summary>
    /// Employee type name in English
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string EmployeeTypeName { get; set; } = string.Empty;

    /// <summary>
    /// Employee type name in Marathi / Local language
    /// </summary>
    [MaxLength(150)]
    public string? EmployeeTypeNameMarathi { get; set; }
}
