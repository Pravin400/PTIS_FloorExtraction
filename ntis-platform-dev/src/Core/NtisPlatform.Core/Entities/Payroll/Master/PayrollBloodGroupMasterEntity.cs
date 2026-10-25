using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using NtisPlatform.Core.Entities;

namespace NtisPlatform.Core.Entities.Payroll.Master;

/// <summary>
/// Entity representing Blood Group Master for Municipal Payroll in schema PRMS.
/// Maps to [PRMS].[BloodGroupMaster] table.
/// </summary>
[Table("BloodGroupMaster", Schema = "PRMS")]
public class PayrollBloodGroupMasterEntity : BaseEntity
{
    /// <summary>
    /// Blood group code (e.g., A+, A-, B+, B-, O+, O-, AB+, AB-)
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string BloodGroupCode { get; set; } = string.Empty;

    /// <summary>
    /// Blood group name (e.g., A+, A-, B+, B-, O+, O-, AB+, AB-)
    /// Unique constraint UQ_BloodGroupMaster_Name in the database.
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string BloodGroupName { get; set; } = string.Empty;
}
