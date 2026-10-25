using System.ComponentModel.DataAnnotations.Schema;

namespace NtisPlatform.Core.Entities.Master;

/// <summary>
/// Represents BHK (bedroom / hall / kitchen) configuration master data (CORE.BHKMaster).
/// Referenced by PropertyMastDetails.BHKId.
/// </summary>
[Table("BHKMaster", Schema = "CORE")]
public class BHKMasterEntity : BaseEntity
{
    [Column(TypeName = "nvarchar(20)")]
    public string BHKCode { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(50)")]
    public string BHKName { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(200)")]
    public string? Description { get; set; }

    public int? DisplayOrder { get; set; }

    /// <summary>Standard number of rooms: bedrooms + hall + kitchen (1R = 1, 1RK = 2, 1BHK = 3, 1.5BHK = 3.5 ...). Null when there is no standard count (Other).</summary>
    [Column(TypeName = "decimal(3,1)")]
    public decimal? RoomCount { get; set; }
}
