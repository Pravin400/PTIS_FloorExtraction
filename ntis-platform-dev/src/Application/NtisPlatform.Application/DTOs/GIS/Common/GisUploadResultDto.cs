namespace NtisPlatform.Application.DTOs.GIS;

/// <summary>
/// Result metadata returned after uploading a spatial GeoJSON boundary file.
/// </summary>
public class GisUploadResultDto
{
    public int LayerMasterId { get; set; }
    public string LayerCode { get; set; } = string.Empty;
    public string LayerName { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public int FeatureCount { get; set; }
}
