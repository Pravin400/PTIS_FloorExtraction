using System.ComponentModel.DataAnnotations.Schema;
using NtisPlatform.Core.Entities.Master;

namespace NtisPlatform.Core.Entities.GIS;

/// <summary>
/// Entity for Dynamic GIS Layer Catalog per Department (Table: GIS.GisLayerMaster)
/// </summary>
[Table("GisLayerMaster", Schema = "GIS")]
public class GisLayerMasterEntity : BaseEntity
{
    public int DepartmentId { get; set; }
    public string LayerCode { get; set; } = null!;
    public string LayerName { get; set; } = null!;
    public string GeometryType { get; set; } = "POLYGON";
    public string? VectorTileUrl { get; set; }
    public string? StyleConfigJson { get; set; }
    public string? PopupSchemaJson { get; set; }
    public int DisplayOrder { get; set; } = 1;
    public bool IsVisibleByDefault { get; set; } = true;


    [ForeignKey(nameof(DepartmentId))]
    public virtual DepartmentMasterEntity? Department { get; set; }
}
