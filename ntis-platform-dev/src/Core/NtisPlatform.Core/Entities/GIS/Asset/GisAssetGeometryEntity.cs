using System;
using System.ComponentModel.DataAnnotations.Schema;
using NetTopologySuite.Geometries;
using NtisPlatform.Core.Entities.Asset_Management;

namespace NtisPlatform.Core.Entities.GIS;

/// <summary>
/// Entity for Asset Spatial Geometry and GIS Polygon Mapping (Table: AMS.GisAssetGeometry)
/// </summary>
[Table("GisAssetGeometry", Schema = "AMS")]
public class GisAssetGeometryEntity : BaseEntity
{
    public int AssetMasterId { get; set; }
    public string? BuildingId { get; set; }
    public Geometry PolygonGeometry { get; set; } = null!;
    public decimal? TotalAreaSqMeter { get; set; }
    public decimal? TotalAreaSqFeet { get; set; }
    public string? GoogleMapLink { get; set; }
    public string? Link360 { get; set; }
    public decimal? CentroidX { get; set; }
    public decimal? CentroidY { get; set; }
    public bool MarkedForDeletion { get; set; }
    public DateTime? MarkedForDeletionDate { get; set; }

    [ForeignKey(nameof(AssetMasterId))]
    public virtual AssetMasterEntity? Asset { get; set; }
}
