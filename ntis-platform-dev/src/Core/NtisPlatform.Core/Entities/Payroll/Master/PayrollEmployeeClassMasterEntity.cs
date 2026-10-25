using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Core.Entities.Payroll.Master;

/// <summary>
/// Entity representing Employee Class Master for Municipal Payroll in schema PRMS.
/// Maps to [PRMS].[EmployeeClassMaster] table.
/// </summary>
[Table("EmployeeClassMaster", Schema = "PRMS")]
public class PayrollEmployeeClassMasterEntity : BaseEntity
{
    [Required]
    [MaxLength(20)]
    public string ClassCode { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string ClassName { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? ClassNameMarathi { get; set; }

    [MaxLength(250)]
    public string? Description { get; set; }
}
