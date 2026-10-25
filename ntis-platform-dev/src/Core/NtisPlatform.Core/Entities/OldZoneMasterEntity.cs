using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NtisPlatform.Core.Entities.Master;

/// <summary>
/// Represents the Old Zone Master entity.
/// </summary>
[Table("OldZoneMaster", Schema = "PTIS")]
public class OldZoneMasterEntity : BaseEntity
{
    [Required]
    public string OldZoneNo { get; set; } = string.Empty;

    [Required]
    public string Description { get; set; } = string.Empty;

    public int? SequenceNo { get; set; }
}
