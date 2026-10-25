namespace NtisPlatform.Core.Entities;

/// <summary>
/// Base entity with common properties for all entities using a 64-bit BIGINT identity key (long Id).
/// </summary>
public abstract class LongBaseEntity
{
    public long Id { get; set; }
    public DateTime? CreatedDate { get; set; }
    public DateTime? UpdatedDate { get; set; }
    public int? CreatedBy { get; set; }
    public int? UpdatedBy { get; set; }
    public bool IsActive { get; set; } = true;
}
