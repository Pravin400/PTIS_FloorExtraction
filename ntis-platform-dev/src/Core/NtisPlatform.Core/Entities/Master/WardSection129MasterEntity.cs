namespace NtisPlatform.Core.Entities;

/// <summary>
/// One row per ward: the single ward-wide Area Inclusion Date Section 129A auto-fetches as the
/// start-year anchor for every property in that ward on its first-ever Apply. There is no Old GP /
/// New GP split and no assessment date — a property's own Occupancy Certificate date (see
/// PropertySection129ApplicationEntity.UseOcDateBasis) is the only alternative anchor.
/// </summary>
public class WardSection129MasterEntity : BaseEntity
{
    public int WardId { get; set; }

    public DateTime? Section129AInclusionDate { get; set; }

    public virtual WardEntity? Ward { get; set; }
}
