using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using NtisPlatform.Core.Entities;

namespace NtisPlatform.Core.Entities.Payroll.Master;

/// <summary>
/// Entity representing District Master for Municipal Payroll in schema PRMS.
/// Maps to [PRMS].[DistrictMaster] table.
/// </summary>
[Table("DistrictMaster", Schema = "PRMS")]
public class PayrollDistrictMasterEntity : BaseEntity
{
    /// <summary>
    /// Foreign key reference to StateMaster
    /// </summary>
    [Required]
    public int StateId { get; set; }

    /// <summary>
    /// Unique code for district within state
    /// </summary>
    [Required]
    [MaxLength(30)]
    public string DistrictCode { get; set; } = string.Empty;

    /// <summary>
    /// District name in English
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string DistrictName { get; set; } = string.Empty;

    /// <summary>
    /// District name in Regional language
    /// </summary>
    [Column("DistrictNameRegional")]
    [MaxLength(150)]
    public string? DistrictNameRegional { get; set; }
}
