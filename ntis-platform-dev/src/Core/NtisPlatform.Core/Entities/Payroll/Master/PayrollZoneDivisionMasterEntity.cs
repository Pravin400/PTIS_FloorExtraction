using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using NtisPlatform.Core.Entities;

namespace NtisPlatform.Core.Entities.Payroll.Master;

/// <summary>
/// Entity representing Zone Division Master for Municipal Payroll in schema PRMS.
/// Maps to [PRMS].[ZoneDivisionMaster] table.
/// </summary>
[Table("ZoneDivisionMaster", Schema = "PRMS")]
public class PayrollZoneDivisionMasterEntity : BaseEntity
{
    /// <summary>
    /// Unique code for the zone/division (e.g., HQ, ZONE_EAST)
    /// </summary>
    [Required]
    [MaxLength(30)]
    public string ZoneDivisionCode { get; set; } = string.Empty;

    /// <summary>
    /// Zone/Division name in English
    /// </summary>
    [Required]
    [MaxLength(150)]
    public string ZoneDivisionName { get; set; } = string.Empty;

    /// <summary>
    /// Zone/Division name in Regional language
    /// </summary>
    [Column("ZoneDivisionNameRegional")]
    [MaxLength(150)]
    public string? ZoneDivisionNameRegional { get; set; }

    /// <summary>
    /// Zone/Division address / office location
    /// </summary>
    [MaxLength(500)]
    public string? Address { get; set; }
}
