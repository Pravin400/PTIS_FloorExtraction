using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using NtisPlatform.Core.Entities;

namespace NtisPlatform.Core.Entities.Payroll.Master;

/// <summary>
/// Entity representing Village Master for Municipal Payroll in schema PRMS.
/// Maps to [PRMS].[VillageMaster] table.
/// </summary>
[Table("VillageMaster", Schema = "PRMS")]
public class PayrollVillageMasterEntity : BaseEntity
{
    /// <summary>
    /// Foreign key reference to TalukaMaster
    /// </summary>
    [Required]
    public int TalukaId { get; set; }

    /// <summary>
    /// Unique code for village within taluka
    /// </summary>
    [Required]
    [MaxLength(30)]
    public string VillageCode { get; set; } = string.Empty;

    /// <summary>
    /// Village name in English
    /// </summary>
    [Required]
    [MaxLength(120)]
    public string VillageName { get; set; } = string.Empty;

    /// <summary>
    /// Village name in Regional language
    /// </summary>
    [Column("VillageNameRegional")]
    [MaxLength(150)]
    public string? VillageNameRegional { get; set; }

    /// <summary>
    /// Postal PIN code
    /// </summary>
    [MaxLength(10)]
    public string? PINCode { get; set; }
}
