using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Core.Entities.Payroll.Master;

/// <summary>
/// Entity representing Employee Status Master for Municipal Payroll in schema PRMS.
/// Maps to [PRMS].[EmployeeStatusMaster] table.
/// </summary>
[Table("EmployeeStatusMaster", Schema = "PRMS")]
public class PayrollEmployeeStatusMasterEntity : BaseEntity
{
    /// <summary>
    /// Unique code for employee status (e.g., ACTIVE, SUSPENDED, RETIRED)
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string EmployeeStatusCode { get; set; } = string.Empty;

    /// <summary>
    /// Employee status display name in English
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string EmployeeStatus { get; set; } = string.Empty;

    /// <summary>
    /// Employee status name in Marathi / Local language
    /// </summary>
    [MaxLength(200)]
    public string? EmployeeStatusMarathi { get; set; }

    /// <summary>
    /// Description / details of the employee status
    /// </summary>
    [MaxLength(500)]
    public string? Description { get; set; }
}
