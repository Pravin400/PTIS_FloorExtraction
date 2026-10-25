using NtisPlatform.Core.Entities;

namespace NtisPlatform.Core.Entities.Master;

/// <summary>
/// Represents flat generation group entity for building structure generation (PTIS.FLatGenerationGroupMaster).
/// </summary>
public class FLatGenerationGroupMasterEntity : BaseEntity
{
    public string FLatGenerationGroup { get; set; } = string.Empty;

    public virtual ICollection<FloorEntity> Floors { get; set; } = new List<FloorEntity>();
}