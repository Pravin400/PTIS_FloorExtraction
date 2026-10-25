using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.DTOs;

namespace NtisPlatform.Application.DTOs;

public class GisCorporationConfigDto : BaseDtos
{
    public int UlbId { get; set; }
    public decimal? DefaultCenterLat { get; set; }
    public decimal? DefaultCenterLng { get; set; }
    public int DefaultZoom { get; set; }
    public int MinZoom { get; set; }
    public int MaxZoom { get; set; }
    public string? BoundingBoxJson { get; set; }
    public string? BasemapsJson { get; set; }
    public string PropertyBoundaryColor { get; set; } = "#0078FF";
}

public class CreateGisCorporationConfigDto : CreateBaseDtos
{
    public new bool IsActive { get; set; } = true;

    [Required(ErrorMessage = "GisCorporationConfig_UlbId_Required")]
    [Range(1, int.MaxValue, ErrorMessage = "GisCorporationConfig_UlbId_Invalid")]
    public int UlbId { get; set; }

    [Range(-90.0, 90.0, ErrorMessage = "GisCorporationConfig_DefaultCenterLat_Invalid")]
    public decimal? DefaultCenterLat { get; set; }

    [Range(-180.0, 180.0, ErrorMessage = "GisCorporationConfig_DefaultCenterLng_Invalid")]
    public decimal? DefaultCenterLng { get; set; }

    [Range(0, 24, ErrorMessage = "GisCorporationConfig_DefaultZoom_Invalid")]
    public int DefaultZoom { get; set; } = 14;

    [Range(0, 24, ErrorMessage = "GisCorporationConfig_MinZoom_Invalid")]
    public int MinZoom { get; set; } = 10;

    [Range(0, 24, ErrorMessage = "GisCorporationConfig_MaxZoom_Invalid")]
    public int MaxZoom { get; set; } = 20;

    public string? BoundingBoxJson { get; set; }
    public string? BasemapsJson { get; set; }

    [StringLength(20, ErrorMessage = "GisCorporationConfig_PropertyBoundaryColor_MaxLen_20")]
    public string PropertyBoundaryColor { get; set; } = "#0078FF";
}

public class UpdateGisCorporationConfigDto : UpdateBaseDtos
{
    [Range(-90.0, 90.0, ErrorMessage = "GisCorporationConfig_DefaultCenterLat_Invalid")]
    public decimal? DefaultCenterLat { get; set; }

    [Range(-180.0, 180.0, ErrorMessage = "GisCorporationConfig_DefaultCenterLng_Invalid")]
    public decimal? DefaultCenterLng { get; set; }

    [Range(0, 24, ErrorMessage = "GisCorporationConfig_DefaultZoom_Invalid")]
    public int DefaultZoom { get; set; }

    [Range(0, 24, ErrorMessage = "GisCorporationConfig_MinZoom_Invalid")]
    public int MinZoom { get; set; }

    [Range(0, 24, ErrorMessage = "GisCorporationConfig_MaxZoom_Invalid")]
    public int MaxZoom { get; set; }

    public string? BoundingBoxJson { get; set; }
    public string? BasemapsJson { get; set; }

    [StringLength(20, ErrorMessage = "GisCorporationConfig_PropertyBoundaryColor_MaxLen_20")]
    public string PropertyBoundaryColor { get; set; } = "#0078FF";
}
