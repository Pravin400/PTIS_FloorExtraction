using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NtisPlatform.Core.Entities.Master;

[Table("OldWardWiseRates", Schema = "PTIS")]
public class OldWardWiseRateEntity
{
    [Key, Column("id")]
    public int Id { get; set; }
    [Column("OldWardID")]
    public int OldWardId { get; set; }
    [Column("OldZONEID")]
    public int? OldZoneId { get; set; }
    [Column("COLLECTIONWARD")]
    public string? CollectionWard { get; set; }
    [Column("ConstructionID")]
    public int? ConstructionId { get; set; }
    [ForeignKey(nameof(ConstructionId))]
    public virtual ConstructionTypeEntity? ConstructionType { get; set; }
    [Column("Residential")]
    public string? Residential { get; set; }
    [Column("Commercial")]
    public string? NonResidential { get; set; }
    [ForeignKey(nameof(OldWardId))]
    public virtual OldWardMasterEntity? OldWard { get; set; }
}
