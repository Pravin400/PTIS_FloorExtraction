using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NtisPlatform.Core.Entities.Master;

/// <summary>
/// Represents the Old Ward Master entity.
/// </summary>
[Table("OldWardMaster", Schema = "PTIS")]
public class OldWardMasterEntity : BaseEntity
{
    [Required]
    public string OldWardNo { get; set; } = string.Empty;

    [Required]
    public string Description { get; set; } = string.Empty;

    public int OldZoneId { get; set; }

    [System.ComponentModel.DataAnnotations.Schema.ForeignKey(nameof(OldZoneId))]
    public virtual OldZoneMasterEntity? OldZone { get; set; }

    public int? SequenceNo { get; set; }
}
