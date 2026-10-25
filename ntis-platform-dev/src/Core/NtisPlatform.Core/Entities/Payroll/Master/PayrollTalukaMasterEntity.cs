using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using NtisPlatform.Core.Entities;

namespace NtisPlatform.Core.Entities.Payroll.Master;

/// <summary>
/// Entity representing Taluka Master for Municipal Payroll in schema PRMS.
/// Maps to [PRMS].[TalukaMaster] table.
/// </summary>
[Table("TalukaMaster", Schema = "PRMS")]
public class PayrollTalukaMasterEntity : BaseEntity
{
    /// <summary>
    /// Foreign key reference to DistrictMaster
    /// </summary>
    [Required]
    public int DistrictId { get; set; }

    /// <summary>
    /// Unique code for taluka within district
    /// </summary>
    [Required]
    [MaxLength(30)]
    public string TalukaCode { get; set; } = string.Empty;

    /// <summary>
    /// Taluka name in English
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string TalukaName { get; set; } = string.Empty;

    /// <summary>
    /// Taluka name in Regional language
    /// </summary>
    [Column("TalukaNameRegional")]
    [MaxLength(150)]
    public string? TalukaNameRegional { get; set; }

    /// <summary>
    /// Indicates whether the taluka is classified as city / urban area
    /// </summary>
    public bool IsCity { get; set; } = false;
}
