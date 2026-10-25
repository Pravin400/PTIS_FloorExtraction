using System.ComponentModel.DataAnnotations.Schema;

namespace NtisPlatform.Core.Entities.GIS;

/// <summary>
/// Entity for GeoJSON Boundary Storage (Table: GIS.GisLayerJson)
/// </summary>
[Table("GisLayerJson", Schema = "GIS")]
public class GisLayerJsonEntity : BaseEntity
{
    public int LayerMasterId { get; set; }

    [Column("GeoJsonData")]
    public string GeoJsonData { get; set; } = null!;


    [ForeignKey(nameof(LayerMasterId))]
    public virtual GisLayerMasterEntity? LayerMaster { get; set; }
}
