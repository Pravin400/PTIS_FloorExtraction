using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Core.Entities.Payroll.Master;

/// <summary>
/// Entity representing Department Master for Municipal Payroll in schema PRMS.
/// Maps to [PRMS].[DepartmentMaster] table.
/// </summary>
[Table("DepartmentMaster", Schema = "PRMS")]
public class PayrollDepartmentMasterEntity : BaseEntity
{
    /// <summary>
    /// Unique code for the department (e.g., ADM, ENG, HEALTH)
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string DepartmentCode { get; set; } = string.Empty;

    /// <summary>
    /// Department name in English
    /// </summary>
    [Required]
    [MaxLength(150)]
    public string DepartmentName { get; set; } = string.Empty;

    /// <summary>
    /// Department name in Marathi / Local language
    /// </summary>
    [Required]
    [MaxLength(150)]
    public string DepartmentNameMarathi { get; set; } = string.Empty;

    /// <summary>
    /// Department description / details
    /// </summary>
    [MaxLength(500)]
    public string? Description { get; set; }
}
