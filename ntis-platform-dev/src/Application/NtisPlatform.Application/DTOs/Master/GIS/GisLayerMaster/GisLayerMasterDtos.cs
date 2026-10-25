using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.DTOs;
using NtisPlatform.Application.DTOs.GIS;

namespace NtisPlatform.Application.DTOs;

public class GisLayerMasterDto : BaseDtos
{
    public int DepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public string LayerCode { get; set; } = null!;
    public string LayerName { get; set; } = null!;
    public string GeometryType { get; set; } = "POLYGON";
    public string? VectorTileUrl { get; set; }
    public string? StyleConfigJson { get; set; }
    public string? PopupSchemaJson { get; set; }
    public int DisplayOrder { get; set; } = 1;
    public bool IsVisibleByDefault { get; set; } = true;
    public bool IsDefaultVisible { get; set; } = true;
}

public class CreateGisLayerMasterDto : CreateBaseDtos
{
    public new bool IsActive { get; set; } = true;

    [Required(ErrorMessage = "GisLayerMaster_DepartmentId_Required")]
    [Range(0, int.MaxValue, ErrorMessage = "GisLayerMaster_DepartmentId_Invalid")]
    public int DepartmentId { get; set; }

    [Required(ErrorMessage = "GisLayerMaster_LayerCode_Required")]
    [StringLength(100, ErrorMessage = "GisLayerMaster_LayerCode_MaxLen_100")]
    public string LayerCode { get; set; } = null!;

    [Required(ErrorMessage = "GisLayerMaster_LayerName_Required")]
    [StringLength(150, ErrorMessage = "GisLayerMaster_LayerName_MaxLen_150")]
    public string LayerName { get; set; } = null!;

    [Required(ErrorMessage = "GisLayerMaster_GeometryType_Required")]
    [StringLength(50, ErrorMessage = "GisLayerMaster_GeometryType_MaxLen_50")]
    public string GeometryType { get; set; } = "POLYGON";

    [StringLength(500, ErrorMessage = "GisLayerMaster_VectorTileUrl_MaxLen_500")]
    public string? VectorTileUrl { get; set; }

    public string? StyleConfigJson { get; set; }
    public string? PopupSchemaJson { get; set; }

    [Range(1, 1000, ErrorMessage = "GisLayerMaster_DisplayOrder_Invalid")]
    public int DisplayOrder { get; set; } = 1;

    private bool _isVisibleByDefault = true;
    public bool IsVisibleByDefault
    {
        get => _isVisibleByDefault;
        set => _isVisibleByDefault = value;
    }
    public bool IsDefaultVisible
    {
        get => _isVisibleByDefault;
        set => _isVisibleByDefault = value;
    }
}

public class UpdateGisLayerMasterDto : UpdateBaseDtos
{
    [Required(ErrorMessage = "GisLayerMaster_LayerName_Required")]
    [StringLength(150, ErrorMessage = "GisLayerMaster_LayerName_MaxLen_150")]
    public string LayerName { get; set; } = null!;

    [Required(ErrorMessage = "GisLayerMaster_GeometryType_Required")]
    [StringLength(50, ErrorMessage = "GisLayerMaster_GeometryType_MaxLen_50")]
    public string GeometryType { get; set; } = "POLYGON";

    [StringLength(500, ErrorMessage = "GisLayerMaster_VectorTileUrl_MaxLen_500")]
    public string? VectorTileUrl { get; set; }

    public string? StyleConfigJson { get; set; }
    public string? PopupSchemaJson { get; set; }

    [Range(1, 1000, ErrorMessage = "GisLayerMaster_DisplayOrder_Invalid")]
    public int DisplayOrder { get; set; } = 1;

    private bool _isVisibleByDefault = true;
    public bool IsVisibleByDefault
    {
        get => _isVisibleByDefault;
        set => _isVisibleByDefault = value;
    }
    public bool IsDefaultVisible
    {
        get => _isVisibleByDefault;
        set => _isVisibleByDefault = value;
    }
}
