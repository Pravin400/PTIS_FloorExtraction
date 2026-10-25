using System.ComponentModel.DataAnnotations.Schema;

namespace NtisPlatform.Core.Entities.Master;

/// <summary>
/// Represents owner type master data in the PTIS system
/// </summary>
[Table("OwnerTypeMaster", Schema = "PTIS")]
public class OwnerTypeMasterEntity : BaseEntity
{
    [Column(TypeName = "nvarchar(100)")]
    public string? OwnerType { get; set; }
}
